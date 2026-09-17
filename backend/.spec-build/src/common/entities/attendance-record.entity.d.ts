import { LiveClass } from './live-class.entity';
import { User } from './user.entity';
export declare enum AttendanceStatus {
    PRESENT = "present",
    ABSENT = "absent",
    LATE = "late"
}
export declare class AttendanceRecord {
    id: string;
    liveClassId: string;
    studentId: string;
    status: AttendanceStatus;
    checkInTime: Date;
    signInDuration: number;
    liveClass: LiveClass;
    student: User;
    createdAt: Date;
    updatedAt: Date;
}
