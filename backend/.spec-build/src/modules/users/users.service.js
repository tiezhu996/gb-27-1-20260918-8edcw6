"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../common/entities/user.entity");
const SELF_UPDATABLE_FIELDS = ['name', 'avatar', 'phone'];
let UsersService = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findAll(role) {
        const where = role ? { role } : {};
        const users = await this.userRepository.find({ where });
        return users.map(({ password, ...user }) => user);
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updateProfile(id, updateData) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        if ((updateData.role !== undefined && updateData.role !== user.role) ||
            (updateData.teacherStatus !== undefined &&
                updateData.teacherStatus !== user.teacherStatus)) {
            throw new common_1.BadRequestException('角色与教师审核状态不能自行修改');
        }
        const allowed = {};
        for (const key of SELF_UPDATABLE_FIELDS) {
            if (updateData[key] !== undefined) {
                allowed[key] = updateData[key];
            }
        }
        Object.assign(user, allowed);
        const updated = await this.userRepository.save(user);
        const { password, ...userWithoutPassword } = updated;
        return userWithoutPassword;
    }
    async submitTeacherCertification(id, certification) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        if (user.role !== user_entity_1.UserRole.TEACHER) {
            throw new common_1.ForbiddenException('只有教师可以提交认证');
        }
        user.teacherCertification = certification;
        user.teacherStatus = user_entity_1.TeacherStatus.PENDING;
        const updated = await this.userRepository.save(user);
        const { password, ...userWithoutPassword } = updated;
        return userWithoutPassword;
    }
    async reviewTeacher(id, approved, reviewerId) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        user.teacherStatus = approved ? user_entity_1.TeacherStatus.APPROVED : user_entity_1.TeacherStatus.REJECTED;
        const updated = await this.userRepository.save(user);
        const { password, ...userWithoutPassword } = updated;
        return userWithoutPassword;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map