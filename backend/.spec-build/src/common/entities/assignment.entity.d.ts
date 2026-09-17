import { Course } from './course.entity';
import { CourseLesson } from './course-lesson.entity';
import { User } from './user.entity';
export declare enum AssignmentType {
    TEXT = "text",
    CHOICE = "choice",
    ATTACHMENT = "attachment"
}
export declare class Assignment {
    id: string;
    title: string;
    description: string;
    courseId: string;
    lessonId: string;
    teacherId: string;
    type: AssignmentType;
    questions: any;
    deadline: Date;
    maxScore: number;
    course: Course;
    lesson: CourseLesson;
    teacher: User;
    createdAt: Date;
    updatedAt: Date;
}
