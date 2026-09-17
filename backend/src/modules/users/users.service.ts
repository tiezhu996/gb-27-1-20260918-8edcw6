import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, TeacherStatus } from '../../common/entities/user.entity';

/** 允许用户自行修改的个人资料字段；角色与审核状态只能走管理员审核流程 */
const SELF_UPDATABLE_FIELDS = ['name', 'avatar', 'phone'] as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(role?: UserRole) {
    const where = role ? { role } : {};
    const users = await this.userRepository.find({ where });
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(id: string, updateData: Partial<User>) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 禁止通过个人资料接口自行提权或伪造教师审核结果
    if (
      (updateData.role !== undefined && updateData.role !== user.role) ||
      (updateData.teacherStatus !== undefined &&
        updateData.teacherStatus !== user.teacherStatus)
    ) {
      throw new BadRequestException('角色与教师审核状态不能自行修改');
    }

    const allowed: Partial<User> = {};
    for (const key of SELF_UPDATABLE_FIELDS) {
      if (updateData[key] !== undefined) {
        allowed[key] = updateData[key] as any;
      }
    }

    Object.assign(user, allowed);
    const updated = await this.userRepository.save(user);
    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async submitTeacherCertification(id: string, certification: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('只有教师可以提交认证');
    }
    
    user.teacherCertification = certification;
    user.teacherStatus = TeacherStatus.PENDING;
    const updated = await this.userRepository.save(user);
    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async reviewTeacher(id: string, approved: boolean, reviewerId: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    
    user.teacherStatus = approved ? TeacherStatus.APPROVED : TeacherStatus.REJECTED;
    const updated = await this.userRepository.save(user);
    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}
