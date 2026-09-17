import { User } from './user.entity';
import { Course } from './course.entity';
export declare enum EnrollmentStatus {
    ACTIVE = "active",
    COMPLETED = "completed"
}
export declare class CourseEnrollment {
    id: string;
    studentId: string;
    courseId: string;
    progress: number;
    status: EnrollmentStatus;
    enrolledAt: Date;
    student: User;
    course: Course;
    createdAt: Date;
    updatedAt: Date;
}
