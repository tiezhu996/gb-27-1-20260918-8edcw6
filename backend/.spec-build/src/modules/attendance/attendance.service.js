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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attendance_record_entity_1 = require("../../common/entities/attendance-record.entity");
const live_class_entity_1 = require("../../common/entities/live-class.entity");
let AttendanceService = class AttendanceService {
    constructor(attendanceRepository, liveClassRepository) {
        this.attendanceRepository = attendanceRepository;
        this.liveClassRepository = liveClassRepository;
    }
    async checkIn(studentId, liveClassId) {
        const liveClass = await this.liveClassRepository.findOne({ where: { id: liveClassId } });
        if (!liveClass) {
            throw new common_1.NotFoundException('直播课堂不存在');
        }
        const existingRecord = await this.attendanceRepository.findOne({
            where: { studentId, liveClassId },
        });
        if (existingRecord) {
            existingRecord.status = attendance_record_entity_1.AttendanceStatus.PRESENT;
            existingRecord.checkInTime = new Date();
            return this.attendanceRepository.save(existingRecord);
        }
        const record = this.attendanceRepository.create({
            studentId,
            liveClassId,
            status: attendance_record_entity_1.AttendanceStatus.PRESENT,
            checkInTime: new Date(),
        });
        return this.attendanceRepository.save(record);
    }
    async getRecordsByLiveClass(liveClassId) {
        return this.attendanceRepository.find({
            where: { liveClassId },
            relations: ['student'],
        });
    }
    async getMyRecords(studentId, courseId) {
        const queryBuilder = this.attendanceRepository
            .createQueryBuilder('record')
            .leftJoinAndSelect('record.liveClass', 'liveClass')
            .leftJoinAndSelect('record.student', 'student')
            .where('record.studentId = :studentId', { studentId });
        if (courseId) {
            queryBuilder.andWhere('liveClass.courseId = :courseId', { courseId });
        }
        return queryBuilder.orderBy('record.createdAt', 'DESC').getMany();
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(live_class_entity_1.LiveClass)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map