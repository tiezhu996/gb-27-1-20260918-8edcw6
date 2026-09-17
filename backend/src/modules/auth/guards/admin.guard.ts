import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../../common/entities/user.entity';

/**
 * 管理员权限守卫：教师资质审核等操作仅管理员可执行，
 * 防止教师自行把审核状态改为通过。
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('需要管理员权限');
    }
    return true;
  }
}
