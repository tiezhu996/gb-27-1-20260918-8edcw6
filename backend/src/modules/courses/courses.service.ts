import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Course, CourseType, CourseStatus } from '../../common/entities/course.entity';
import { CourseLesson } from '../../common/entities/course-lesson.entity';
import { CourseEnrollment } from '../../common/entities/course-enrollment.entity';
import { User, UserRole, TeacherStatus } from '../../common/entities/user.entity';

type CoursePatch = Partial<Omit<Course, 'id' | 'teacherId' | 'createdAt' | 'updatedAt'>>;

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

  /**
   * 校验当前用户是“审核通过”的教师。
   * 页面入口隐藏只是体验优化，真正的权限边界在服务端：任何课程写操作都必须通过本检查。
   */
  private async assertApprovedTeacher(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('只有教师可以操作课程');
    }
    if (user.teacherStatus !== TeacherStatus.APPROVED) {
      throw new ForbiddenException('教师资质尚未审核通过，不能创建或发布课程');
    }
    return user;
  }

  /**
   * 归一化课程字段：
   * - 剥离 status，防止绕过发布流程直接写入上架状态
   * - 免费课程价格无条件归零，付费课程价格转为数字
   * 不在这里抛价格错误——违规原因统一由 collectSellingViolations 收集，
   * 保证一次返回全部问题；数据库 CHECK 约束负责兜底。
   */
  private normalizePatch(patch: CoursePatch): CoursePatch {
    const normalized: CoursePatch = { ...patch };
    delete normalized.status;

    if (normalized.type === CourseType.FREE) {
      normalized.price = 0;
    } else if (normalized.type === CourseType.PAID && normalized.price !== undefined) {
      const price = Number(normalized.price);
      normalized.price = Number.isFinite(price) ? price : -1;
    }
    return normalized;
  }

  /** 价格规则违规原因（免费=0、付费>0），任何写入路径都必须满足 */
  private collectPriceViolations(course: Course): string[] {
    const violations: string[] = [];
    if (course.type === CourseType.PAID) {
      if (!(Number(course.price) > 0)) violations.push('付费课程价格必须大于 0');
    } else if (course.type === CourseType.FREE) {
      if (Number(course.price) !== 0) violations.push('免费课程价格必须为 0');
    }
    return violations;
  }

  /**
   * 收集“售卖条件”全部违规原因，而不是遇到第一个就返回，
   * 便于一次性向教师展示所有需要修正的问题。
   */
  private collectSellingViolations(course: Course, lessonCount: number): string[] {
    const violations: string[] = [];

    if (!course.name?.trim()) violations.push('课程名称不能为空');
    if (!course.cover?.trim()) violations.push('课程封面不能为空');
    if (!course.description?.trim()) violations.push('课程简介不能为空');
    if (!course.category?.trim()) violations.push('课程分类不能为空');

    violations.push(...this.collectPriceViolations(course));

    if (lessonCount < 1) violations.push('课程至少需要包含 1 个课时');

    return violations;
  }

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

  async create(userId: string, courseData: CoursePatch) {
    await this.assertApprovedTeacher(userId);

    const patch = this.normalizePatch(courseData);

    const priceViolations = this.collectPriceViolations(patch as Course);
    if (priceViolations.length > 0) {
      throw new BadRequestException(priceViolations, '课程信息不合法');
    }

    const course = this.courseRepository.create({
      name: '',
      description: '',
      category: '',
      type: CourseType.FREE,
      tags: [],
      ...patch,
      cover:
        patch.cover?.trim() ||
        `https://picsum.photos/seed/${Date.now()}/400/300`,
      teacherId: userId,
      // 无论请求体是否携带 status，新建课程一律为草稿；上架必须走发布校验
      status: CourseStatus.DRAFT,
    });
    return this.courseRepository.save(course);
  }

  /**
   * 编辑课程。
   * 对已上架课程：在一个数据库事务内完成“加行锁读取 → 合并新值 → 全量校验 → 写入”。
   * 任一售卖条件不满足都会抛错并回滚，课程保持原样（不会先下架，也不会留下半更新内容）。
   */
  async update(userId: string, id: string, courseData: CoursePatch) {
    await this.assertApprovedTeacher(userId);

    const patch = this.normalizePatch(courseData);

    return this.dataSource.transaction(async (manager) => {
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

      // 合并出“保存后”的课程快照，基于快照做全量校验
      const merged = manager.create(Course, { ...course, ...patch });

      if (course.status === CourseStatus.PUBLISHED) {
        // 已上架课程：必须满足全部售卖条件（信息完整 + 价格规则 + 至少 1 课时）
        const lessonCount = await manager.count(CourseLesson, { where: { courseId: id } });
        const violations = this.collectSellingViolations(merged, lessonCount);
        if (violations.length > 0) {
          // 抛出后事务回滚：不会下架、不会写入任何字段
          throw new BadRequestException(
            violations,
            '已上架课程必须满足全部售卖条件，本次修改未保存',
          );
        }
      } else {
        // 草稿：价格规则也必须满足，其余条件在上架时检查
        const violations = this.collectPriceViolations(merged);
        if (violations.length > 0) {
          throw new BadRequestException(violations, '价格不合法，本次修改未保存');
        }
      }

      return manager.save(Course, merged);
    });
  }

  /**
   * 发布（上架）课程：教师资质 + 全部售卖条件通过后才允许置为 published。
   */
  async publish(userId: string, id: string) {
    await this.assertApprovedTeacher(userId);

    return this.dataSource.transaction(async (manager) => {
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

      // 免费课程价格始终归一为 0；付费价格不合法时由下面的售卖条件校验统一收集原因
      const normalized = manager.create(Course, {
        ...course,
        price: course.type === CourseType.FREE ? 0 : Number(course.price),
      });

      const lessonCount = await manager.count(CourseLesson, { where: { courseId: id } });
      const violations = this.collectSellingViolations(normalized, lessonCount);
      if (violations.length > 0) {
        throw new BadRequestException(violations, '课程不满足上架条件');
      }

      normalized.status = CourseStatus.PUBLISHED;
      return manager.save(Course, normalized);
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
      ...lessonData,
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
