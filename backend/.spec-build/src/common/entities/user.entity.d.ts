export declare enum UserRole {
    STUDENT = "student",
    TEACHER = "teacher",
    ADMIN = "admin"
}
export declare enum TeacherStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class User {
    id: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    name: string;
    avatar: string;
    teacherStatus: TeacherStatus;
    teacherCertification: string;
    wechatOpenId: string;
    createdAt: Date;
    updatedAt: Date;
}
