import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User, UserRole, TeacherStatus } from '../../common/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        user: {
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
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
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
        };
    }>;
    validateUser(id: string): Promise<User>;
}
