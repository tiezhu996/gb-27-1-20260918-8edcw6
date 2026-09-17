import { CoursesService } from './courses.service';
import { CourseType } from '../../common/entities/course.entity';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    findAll(category?: string, tag?: string, type?: CourseType, keyword?: string): Promise<import("../../common/entities/course.entity").Course[]>;
    findMyCourses(req: any): Promise<import("../../common/entities/course.entity").Course[]>;
    create(req: any, courseData: any): Promise<import("../../common/entities/course.entity").Course>;
    findOne(id: string): Promise<import("../../common/entities/course.entity").Course>;
    update(id: string, courseData: any, req: any): Promise<import("../../common/entities/course.entity").Course>;
    publish(id: string, req: any): Promise<import("../../common/entities/course.entity").Course>;
    enroll(courseId: string, req: any): Promise<import("../../common/entities/course-enrollment.entity").CourseEnrollment>;
    getEnrollment(courseId: string, req: any): Promise<import("../../common/entities/course-enrollment.entity").CourseEnrollment>;
    createLesson(courseId: string, lessonData: any, req: any): Promise<import("../../common/entities/course-lesson.entity").CourseLesson>;
    findLesson(lessonId: string): Promise<import("../../common/entities/course-lesson.entity").CourseLesson>;
}
