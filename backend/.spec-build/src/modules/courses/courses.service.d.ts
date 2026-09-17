import { Repository, DataSource } from 'typeorm';
import { Course, CourseType } from '../../common/entities/course.entity';
import { CourseLesson } from '../../common/entities/course-lesson.entity';
import { CourseEnrollment } from '../../common/entities/course-enrollment.entity';
import { User, UserRole } from '../../common/entities/user.entity';
export declare class CoursesService {
    private readonly courseRepository;
    private readonly lessonRepository;
    private readonly enrollmentRepository;
    private readonly userRepository;
    private readonly dataSource;
    constructor(courseRepository: Repository<Course>, lessonRepository: Repository<CourseLesson>, enrollmentRepository: Repository<CourseEnrollment>, userRepository: Repository<User>, dataSource: DataSource);
    findAll(query: {
        category?: string;
        tag?: string;
        type?: CourseType;
        keyword?: string;
    }): Promise<Course[]>;
    findMyCourses(userId: string, role: UserRole): Promise<Course[]>;
    findOne(id: string): Promise<Course>;
    private assertApprovedTeacher;
    private validateSaleConditions;
    private pickWritableFields;
    private rejectWithReasons;
    create(userId: string, courseData: Partial<Course>): Promise<Course>;
    update(userId: string, id: string, courseData: Partial<Course>): Promise<Course>;
    publish(userId: string, id: string): Promise<Course>;
    enroll(studentId: string, courseId: string): Promise<CourseEnrollment>;
    getEnrollment(studentId: string, courseId: string): Promise<CourseEnrollment>;
    createLesson(userId: string, courseId: string, lessonData: Partial<CourseLesson>): Promise<CourseLesson>;
    findLesson(id: string): Promise<CourseLesson>;
}
