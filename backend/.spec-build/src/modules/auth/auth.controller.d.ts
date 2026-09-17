import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            username: string;
            email: string;
            phone: string;
            role: import("../../common/entities/user.entity").UserRole;
            name: string;
            avatar: string;
            teacherStatus: import("../../common/entities/user.entity").TeacherStatus;
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
            role: import("../../common/entities/user.entity").UserRole;
            name: string;
            avatar: string;
            teacherStatus: import("../../common/entities/user.entity").TeacherStatus;
            teacherCertification: string;
            wechatOpenId: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getProfile(req: any): any;
}
