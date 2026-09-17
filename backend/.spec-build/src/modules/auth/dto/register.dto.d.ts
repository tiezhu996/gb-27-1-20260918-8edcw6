import { UserRole } from '../../../common/entities/user.entity';
export declare class RegisterDto {
    email: string;
    phone?: string;
    username?: string;
    password: string;
    name: string;
    role: UserRole;
}
