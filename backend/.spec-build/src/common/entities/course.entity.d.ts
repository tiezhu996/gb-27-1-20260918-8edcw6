import { User } from './user.entity';
import { CourseLesson } from './course-lesson.entity';
import { CourseEnrollment } from './course-enrollment.entity';
export declare enum CourseType {
    FREE = "free",
    PAID = "paid"
}
export declare enum CourseStatus {
    DRAFT = "draft",
    PUBLISHED = "published"
}
export declare class Course {
    id: string;
    name: string;
    cover: string;
    description: string;
    type: CourseType;
    price: number;
    category: string;
    tags: string[];
    status: CourseStatus;
    teacherId: string;
    teacher: User;
    lessons: CourseLesson[];
    enrollments: CourseEnrollment[];
    createdAt: Date;
    updatedAt: Date;
}
