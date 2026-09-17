"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const course_entity_1 = require("../../common/entities/course.entity");
const course_lesson_entity_1 = require("../../common/entities/course-lesson.entity");
const course_enrollment_entity_1 = require("../../common/entities/course-enrollment.entity");
const user_entity_1 = require("../../common/entities/user.entity");
const WRITABLE_COURSE_FIELDS = [
    'name',
    'cover',
    'description',
    'type',
    'price',
    'category',
    'tags',
];
let CoursesService = class CoursesService {
    constructor(courseRepository, lessonRepository, enrollmentRepository, userRepository, dataSource) {
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
    }
    async findAll(query) {
        const where = { status: course_entity_1.CourseStatus.PUBLISHED };
        if (query.category)
            where.category = query.category;
        if (query.type)
            where.type = query.type;
        if (query.keyword)
            where.name = (0, typeorm_2.Like)(`%${query.keyword}%`);
        const courses = await this.courseRepository.find({
            where,
            relations: ['teacher'],
            order: { createdAt: 'DESC' },
        });
        if (query.tag) {
            return courses.filter(course => course.tags && course.tags.includes(query.tag));
        }
        return courses;
    }
    async findMyCourses(userId, role) {
        if (role === user_entity_1.UserRole.TEACHER) {
            return this.courseRepository.find({
                where: { teacherId: userId },
                relations: ['teacher', 'lessons'],
                order: { createdAt: 'DESC' },
            });
        }
        if (role === user_entity_1.UserRole.STUDENT) {
            const enrollments = await this.enrollmentRepository.find({
                where: { studentId: userId },
                relations: ['course', 'course.teacher'],
            });
            return enrollments.map(e => e.course);
        }
        return [];
    }
    async findOne(id) {
        const course = await this.courseRepository.findOne({
            where: { id },
            relations: ['teacher', 'lessons'],
        });
        if (!course) {
            throw new common_1.NotFoundException('课程不存在');
        }
        return course;
    }
    async assertApprovedTeacher(userId) {
        const teacher = await this.userRepository.findOne({ where: { id: userId } });
        if (!teacher || teacher.role !== user_entity_1.UserRole.TEACHER) {
            throw new common_1.ForbiddenException('只有教师可以操作课程');
        }
        if (teacher.teacherStatus !== user_entity_1.TeacherStatus.APPROVED) {
            const reason = teacher.teacherStatus === user_entity_1.TeacherStatus.PENDING
                ? '教师资质正在审核中，审核通过后才能操作课程'
                : '教师资质未通过审核，不能操作课程';
            throw new common_1.ForbiddenException(reason);
        }
        return teacher;
    }
    validateSaleConditions(data, lessonCount, requireLessons) {
        const reasons = [];
        const normalizedPrice = data.type === course_entity_1.CourseType.FREE ? 0 : Number(data.price);
        if (data.type === course_entity_1.CourseType.PAID) {
            if (data.price === null ||
                data.price === undefined ||
                Number.isNaN(normalizedPrice)) {
                reasons.push('付费课程必须设置价格');
            }
            else if (normalizedPrice <= 0) {
                reasons.push('付费课程价格必须大于 0');
            }
        }
        else if (data.price !== null &&
            data.price !== undefined &&
            Number(data.price) !== 0) {
            reasons.push('免费课程价格必须为 0');
        }
        if (requireLessons && lessonCount < 1) {
            reasons.push('上架课程至少需要一个课时');
        }
        return { price: normalizedPrice, reasons };
    }
    pickWritableFields(courseData) {
        const picked = {};
        for (const key of WRITABLE_COURSE_FIELDS) {
            if (courseData[key] !== undefined) {
                picked[key] = courseData[key];
            }
        }
        return picked;
    }
    rejectWithReasons(reasons) {
        throw new common_1.BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: reasons.join('；'),
            reasons,
        });
    }
    async create(userId, courseData) {
        await this.assertApprovedTeacher(userId);
        const data = this.pickWritableFields(courseData);
        const type = data.type || course_entity_1.CourseType.FREE;
        const { price, reasons } = this.validateSaleConditions({ type, price: Number(data.price ?? 0) }, 0, false);
        if (reasons.length > 0) {
            this.rejectWithReasons(reasons);
        }
        const course = this.courseRepository.create({
            ...data,
            type,
            price,
            teacherId: userId,
            status: course_entity_1.CourseStatus.DRAFT,
        });
        return this.courseRepository.save(course);
    }
    async update(userId, id, courseData) {
        await this.assertApprovedTeacher(userId);
        return this.dataSource.transaction(async (manager) => {
            const course = await manager.findOne(course_entity_1.Course, {
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!course) {
                throw new common_1.NotFoundException('课程不存在');
            }
            if (course.teacherId !== userId) {
                throw new common_1.ForbiddenException('无权修改此课程');
            }
            const data = this.pickWritableFields(courseData);
            if (courseData.status !== undefined &&
                courseData.status !== course.status) {
                throw new common_1.BadRequestException('不能通过编辑接口修改课程上下架状态');
            }
            const mergedType = data.type !== undefined ? data.type : course.type;
            const mergedPrice = data.price !== undefined ? Number(data.price) : Number(course.price);
            const isPublished = course.status === course_entity_1.CourseStatus.PUBLISHED;
            const lessonCount = await manager.count(course_lesson_entity_1.CourseLesson, {
                where: { courseId: id },
            });
            const { price, reasons } = this.validateSaleConditions({ type: mergedType, price: mergedPrice }, lessonCount, isPublished);
            if (reasons.length > 0) {
                this.rejectWithReasons(reasons);
            }
            const next = manager.create(course_entity_1.Course, {
                ...data,
                type: mergedType,
                price,
            });
            Object.assign(course, next);
            return manager.save(course);
        });
    }
    async publish(userId, id) {
        await this.assertApprovedTeacher(userId);
        return this.dataSource.transaction(async (manager) => {
            const course = await manager.findOne(course_entity_1.Course, {
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!course) {
                throw new common_1.NotFoundException('课程不存在');
            }
            if (course.teacherId !== userId) {
                throw new common_1.ForbiddenException('无权操作此课程');
            }
            const lessonCount = await manager.count(course_lesson_entity_1.CourseLesson, {
                where: { courseId: id },
            });
            const { price, reasons } = this.validateSaleConditions({ type: course.type, price: Number(course.price) }, lessonCount, true);
            if (reasons.length > 0) {
                this.rejectWithReasons(reasons);
            }
            course.price = price;
            course.status = course_entity_1.CourseStatus.PUBLISHED;
            return manager.save(course);
        });
    }
    async enroll(studentId, courseId) {
        const course = await this.courseRepository.findOne({ where: { id: courseId } });
        if (!course) {
            throw new common_1.NotFoundException('课程不存在');
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
    async getEnrollment(studentId, courseId) {
        return this.enrollmentRepository.findOne({
            where: { studentId, courseId },
        });
    }
    async createLesson(userId, courseId, lessonData) {
        await this.assertApprovedTeacher(userId);
        const course = await this.courseRepository.findOne({ where: { id: courseId } });
        if (!course) {
            throw new common_1.NotFoundException('课程不存在');
        }
        if (course.teacherId !== userId) {
            throw new common_1.ForbiddenException('无权操作此课程');
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
    async findLesson(id) {
        const lesson = await this.lessonRepository.findOne({
            where: { id },
            relations: ['course'],
        });
        if (!lesson) {
            throw new common_1.NotFoundException('课时不存在');
        }
        return lesson;
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(1, (0, typeorm_1.InjectRepository)(course_lesson_entity_1.CourseLesson)),
    __param(2, (0, typeorm_1.InjectRepository)(course_enrollment_entity_1.CourseEnrollment)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], CoursesService);
//# sourceMappingURL=courses.service.js.map