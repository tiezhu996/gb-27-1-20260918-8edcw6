import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Course, CourseType, CourseStatus } from '../../common/entities/course.entity';
import { CourseLesson } from '../../common/entities/course-lesson.entity';
import { CourseEnrollment } from '../../common/entities/course-enrollment.entity';
import { User, UserRole, TeacherStatus } from '../../common/entities/user.entity';

/** 允许教师通过接口写入的课程字段，防止越权篡改 teacherId / status 等字段 */
const WRITABLE_COURSE_FIELDS = [
  'name',
  'cover',
  'description',
  'type',
  'price',
  'category',
  'tags',
] as const;
type WritableCourseData = Partial<Pick<Course, (typeof WRITABLE_COURSE_FIELDS)[number]>>;

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseLesson)
    private readonly lessonRepository: Repository<CourseLesson>,
    @InjectRepository(CourseEnrollment)
    private readonly enrollmentRepository: Repository<CourseEnrollment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: { category?: string; tag?: string; type?: CourseType; keyword?: string }) {
    const where: any = { status: CourseStatus.PUBLISHED };

    if (query.category) where.category = query.category;
    if (query.type) where.type = query.type;
    if (query.keyword) where.name = Like(`%${query.keyword}%`);

    const courses = await this.courseRepository.find({
      where,
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
    });

    if (query.tag) {
      return courses.filter(course =>
        course.tags && course.tags.includes(query.tag)
      );
    }

    return courses;
  }

  async findMyCourses(userId: string, role: UserRole) {
    if (role === UserRole.TEACHER) {
      return this.courseRepository.find({
        where: { teacherId: userId },
        relations: ['teacher', 'lessons'],
        order: { createdAt: 'DESC' },
      });
    }

    if (role === UserRole.STUDENT) {
      const enrollments = await this.enrollmentRepository.find({
        where: { studentId: userId },
        relations: ['course', 'course.teacher'],
      });
      return enrollments.map(e => e.course);
    }

    return [];
  }

  async findOne(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['teacher', 'lessons'],
    });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }
    return course;
  }

  /**
   * 校验教师资质：未审核通过（含待审核、已驳回）的教师不能创建/发布/修改课程，
   * 即使绕过页面直接调用接口也会被拒绝。
   */
  private async assertApprovedTeacher(userId: string): Promise<User> {
    const teacher = await this.userRepository.findOne({ where: { id: userId } });
    if (!teacher || teacher.role !== UserRole.TEACHER) {
      throw new ForbiddenException('只有教师可以操作课程');
    }
    if (teacher.teacherStatus !== TeacherStatus.APPROVED) {
      const reason =
        teacher.teacherStatus === TeacherStatus.PENDING
          ? '教师资质正在审核中，审核通过后才能操作课程'
          : '教师资质未通过审核，不能操作课程';
      throw new ForbiddenException(reason);
    }
    return teacher;
  }

  /**
   * 校验课程的售卖条件：
   * - 付费课程价格必须大于 0
   * - 免费课程价格固定为 0
   * - 已上架/待上架课程至少有一个课时
   * 返回归一化后的价格（免费课强制为 0）。
   */
  private validateSaleConditions(
    data: { type: CourseType; price: number },
    lessonCount: number,
    requireLessons: boolean,
  ): { price: number; reasons: string[] } {
    const reasons: string[] = [];
    const normalizedPrice = data.type === CourseType.FREE ? 0 : Number(data.price);

    if (data.type === CourseType.PAID) {
      if (
        data.price === null ||
        data.price === undefined ||
        Number.isNaN(normalizedPrice)
      ) {
        reasons.push('付费课程必须设置价格');
      } else if (normalizedPrice <= 0) {
        reasons.push('付费课程价格必须大于 0');
      }
    } else if (
      data.price !== null &&
      data.price !== undefined &&
      Number(data.price) !== 0
    ) {
      reasons.push('免费课程价格必须为 0');
    }

    if (requireLessons && lessonCount < 1) {
      reasons.push('上架课程至少需要一个课时');
    }

    return { price: normalizedPrice, reasons };
  }

  private pickWritableFields(courseData: Partial<Course>): WritableCourseData {
    const picked: WritableCourseData = {};
    for (const key of WRITABLE_COURSE_FIELDS) {
      if (courseData[key] !== undefined) {
        (picked as any)[key] = courseData[key];
      }
    }
    return picked;
  }

  /** 整单拒绝：返回全部具体原因，调用方不会写入任何字段 */
  private rejectWithReasons(reasons: string[]): never {
    throw new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: reasons.join('；'),
      reasons,
    });
  }

  async create(userId: string, courseData: Partial<Course>) {
    await this.assertApprovedTeacher(userId);

    const data = this.pickWritableFields(courseData);
    const type = (data.type as CourseType) || CourseType.FREE;
    const { price, reasons } = this.validateSaleConditions(
      { type, price: Number(data.price ?? 0) },
      0,
      false,
    );
    if (reasons.length > 0) {
      this.rejectWithReasons(reasons);
    }

    const course = this.courseRepository.create({
      ...data,
      type,
      price,
      teacherId: userId,
      status: CourseStatus.DRAFT,
    });
    return this.courseRepository.save(course);
  }

  async update(userId: string, id: string, courseData: Partial<Course>) {
    await this.assertApprovedTeacher(userId);

    // 全部校验放在事务中完成：校验失败直接回滚，不会出现先改一部分再失败的“半更新”
    return this.dataSource.transaction(async manager => {
      const course = await manager.findOne(Course, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!course) {
        throw new NotFoundException('课程不存在');
      }
      if (course.teacherId !== userId) {
        throw new ForbiddenException('无权修改此课程');
      }

      const data = this.pickWritableFields(courseData);

      // 禁止通过编辑接口私自上架/下架，状态变更只能走 publish
      if (
        courseData.status !== undefined &&
        courseData.status !== course.status
      ) {
        throw new BadRequestException('不能通过编辑接口修改课程上下架状态');
      }

      const mergedType =
        data.type !== undefined ? (data.type as CourseType) : course.type;
      const mergedPrice =
        data.price !== undefined ? Number(data.price) : Number(course.price);

      // 已上架课程：编辑后的结果必须仍然满足全部售卖条件，否则原子拒绝整次保存
      const isPublished = course.status === CourseStatus.PUBLISHED;
      const lessonCount = await manager.count(CourseLesson, {
        where: { courseId: id },
      });

      const { price, reasons } = this.validateSaleConditions(
        { type: mergedType, price: mergedPrice },
        lessonCount,
        isPublished,
      );
      if (reasons.length > 0) {
        this.rejectWithReasons(reasons);
      }

      const next = manager.create(Course, {
        ...data,
        type: mergedType,
        price,
      });
      Object.assign(course, next);
      return manager.save(course);
    });
  }

  async publish(userId: string, id: string) {
    await this.assertApprovedTeacher(userId);

    // 发布即“以上架状态保存”：价格与课时条件在同一事务内校验并落库，失败不会产生任何变更
    return this.dataSource.transaction(async manager => {
      const course = await manager.findOne(Course, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!course) {
        throw new NotFoundException('课程不存在');
      }
      if (course.teacherId !== userId) {
        throw new ForbiddenException('无权操作此课程');
      }

      const lessonCount = await manager.count(CourseLesson, {
        where: { courseId: id },
      });
      const { price, reasons } = this.validateSaleConditions(
        { type: course.type, price: Number(course.price) },
        lessonCount,
        true,
      );
      if (reasons.length > 0) {
        this.rejectWithReasons(reasons);
      }

      course.price = price;
      course.status = CourseStatus.PUBLISHED;
      return manager.save(course);
    });
  }

  async enroll(studentId: string, courseId: string) {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { studentId, courseId },
    });

    if (existingEnrollment) {
      return existingEnrollment;
    }

    const enrollment = this.enrollmentRepository.create({
      studentId,
      courseId,
      enrolledAt: new Date(),
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async getEnrollment(studentId: string, courseId: string) {
    return this.enrollmentRepository.findOne({
      where: { studentId, courseId },
    });
  }

  async createLesson(userId: string, courseId: string, lessonData: Partial<CourseLesson>) {
    await this.assertApprovedTeacher(userId);

    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }
    if (course.teacherId !== userId) {
      throw new ForbiddenException('无权操作此课程');
    }

    const maxOrder = await this.lessonRepository
      .createQueryBuilder('lesson')
      .where('lesson.courseId = :courseId', { courseId })
      .select('MAX(lesson.order)', 'max')
      .getRawOne();

    const lesson = this.lessonRepository.create({
      title: lessonData.title,
      description: lessonData.description,
      duration: lessonData.duration,
      videoUrl: lessonData.videoUrl,
      coursewareUrl: lessonData.coursewareUrl,
      isLive: lessonData.isLive,
      liveStartTime: lessonData.liveStartTime,
      liveEndTime: lessonData.liveEndTime,
      courseId,
      order: (maxOrder?.max || 0) + 1,
    });

    return this.lessonRepository.save(lesson);
  }

  async findLesson(id: string) {
    const lesson = await this.lessonRepository.findOne({
      where: { id },
      relations: ['course'],
    });
    if (!lesson) {
      throw new NotFoundException('课时不存在');
    }
    return lesson;
  }
}
