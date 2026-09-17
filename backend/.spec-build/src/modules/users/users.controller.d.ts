import { UsersService } from './users.service';
import { UserRole } from '../../common/entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(role?: UserRole): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: import("../../common/entities/user.entity").TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getProfile(req: any): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: import("../../common/entities/user.entity").TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findOne(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: import("../../common/entities/user.entity").TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(req: any, updateData: any): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: import("../../common/entities/user.entity").TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    submitTeacherCertification(req: any, body: {
        certification: string;
    }): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: import("../../common/entities/user.entity").TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    reviewTeacher(id: string, body: {
        approved: boolean;
    }, req: any): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: import("../../common/entities/user.entity").TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
