import { Repository } from 'typeorm';
import { User, UserRole, TeacherStatus } from '../../common/entities/user.entity';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    findAll(role?: UserRole): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(id: string, updateData: Partial<User>): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    submitTeacherCertification(id: string, certification: string): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    reviewTeacher(id: string, approved: boolean, reviewerId: string): Promise<{
        id: string;
        username: string;
        email: string;
        phone: string;
        role: UserRole;
        name: string;
        avatar: string;
        teacherStatus: TeacherStatus;
        teacherCertification: string;
        wechatOpenId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
