import { Course } from './course.entity';
import { CourseLesson } from './course-lesson.entity';
import { User } from './user.entity';
export declare enum LiveClassStatus {
    SCHEDULED = "scheduled",
    LIVE = "live",
    ENDED = "ended"
}
export declare class LiveClass {
    id: string;
    title: string;
    courseId: string;
    lessonId: string;
    teacherId: string;
    status: LiveClassStatus;
    maxParticipants: number;
    currentParticipants: number;
    scheduledStartTime: Date;
    actualStartTime: Date;
    endTime: Date;
    course: Course;
    lesson: CourseLesson;
    teacher: User;
    createdAt: Date;
    updatedAt: Date;
}
