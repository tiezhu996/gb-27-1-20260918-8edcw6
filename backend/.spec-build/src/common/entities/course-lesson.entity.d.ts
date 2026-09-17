import { Course } from './course.entity';
export declare class CourseLesson {
    id: string;
    title: string;
    description: string;
    duration: number;
    order: number;
    videoUrl: string;
    coursewareUrl: string;
    isLive: boolean;
    liveStartTime: Date;
    liveEndTime: Date;
    isRecordingGenerated: boolean;
    courseId: string;
    course: Course;
    createdAt: Date;
    updatedAt: Date;
}
