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
exports.LiveClassesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const live_class_entity_1 = require("../../common/entities/live-class.entity");
let LiveClassesService = class LiveClassesService {
    constructor(liveClassRepository) {
        this.liveClassRepository = liveClassRepository;
    }
    async findAll() {
        return this.liveClassRepository.find({
            relations: ['course', 'teacher'],
            order: { scheduledStartTime: 'DESC' },
        });
    }
    async findOne(id) {
        const liveClass = await this.liveClassRepository.findOne({
            where: { id },
            relations: ['course', 'teacher'],
        });
        if (!liveClass) {
            throw new common_1.NotFoundException('直播课堂不存在');
        }
        return liveClass;
    }
    async create(userId, data) {
        const liveClass = this.liveClassRepository.create({
            ...data,
            teacherId: userId,
            status: live_class_entity_1.LiveClassStatus.SCHEDULED,
        });
        return this.liveClassRepository.save(liveClass);
    }
    async startLive(userId, id) {
        const liveClass = await this.liveClassRepository.findOne({ where: { id } });
        if (!liveClass) {
            throw new common_1.NotFoundException('直播课堂不存在');
        }
        if (liveClass.teacherId !== userId) {
            throw new common_1.ForbiddenException('无权操作此直播');
        }
        liveClass.status = live_class_entity_1.LiveClassStatus.LIVE;
        liveClass.actualStartTime = new Date();
        return this.liveClassRepository.save(liveClass);
    }
    async endLive(userId, id) {
        const liveClass = await this.liveClassRepository.findOne({ where: { id } });
        if (!liveClass) {
            throw new common_1.NotFoundException('直播课堂不存在');
        }
        if (liveClass.teacherId !== userId) {
            throw new common_1.ForbiddenException('无权操作此直播');
        }
        liveClass.status = live_class_entity_1.LiveClassStatus.ENDED;
        liveClass.endTime = new Date();
        return this.liveClassRepository.save(liveClass);
    }
    async updateParticipants(id, count) {
        const liveClass = await this.liveClassRepository.findOne({ where: { id } });
        if (!liveClass)
            return;
        liveClass.currentParticipants = Math.max(0, count);
        return this.liveClassRepository.save(liveClass);
    }
};
exports.LiveClassesService = LiveClassesService;
exports.LiveClassesService = LiveClassesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(live_class_entity_1.LiveClass)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LiveClassesService);
//# sourceMappingURL=live-classes.service.js.map