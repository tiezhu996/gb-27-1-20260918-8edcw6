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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveClass = exports.LiveClassStatus = void 0;
const typeorm_1 = require("typeorm");
const course_entity_1 = require("./course.entity");
const course_lesson_entity_1 = require("./course-lesson.entity");
const user_entity_1 = require("./user.entity");
var LiveClassStatus;
(function (LiveClassStatus) {
    LiveClassStatus["SCHEDULED"] = "scheduled";
    LiveClassStatus["LIVE"] = "live";
    LiveClassStatus["ENDED"] = "ended";
})(LiveClassStatus || (exports.LiveClassStatus = LiveClassStatus = {}));
let LiveClass = class LiveClass {
};
exports.LiveClass = LiveClass;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LiveClass.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LiveClass.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LiveClass.prototype, "courseId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LiveClass.prototype, "lessonId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LiveClass.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: LiveClassStatus, default: LiveClassStatus.SCHEDULED }),
    __metadata("design:type", String)
], LiveClass.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 200 }),
    __metadata("design:type", Number)
], LiveClass.prototype, "maxParticipants", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LiveClass.prototype, "currentParticipants", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LiveClass.prototype, "scheduledStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LiveClass.prototype, "actualStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LiveClass.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => course_entity_1.Course),
    (0, typeorm_1.JoinColumn)({ name: 'courseId' }),
    __metadata("design:type", course_entity_1.Course)
], LiveClass.prototype, "course", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => course_lesson_entity_1.CourseLesson),
    (0, typeorm_1.JoinColumn)({ name: 'lessonId' }),
    __metadata("design:type", course_lesson_entity_1.CourseLesson)
], LiveClass.prototype, "lesson", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", user_entity_1.User)
], LiveClass.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LiveClass.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LiveClass.prototype, "updatedAt", void 0);
exports.LiveClass = LiveClass = __decorate([
    (0, typeorm_1.Entity)('live_classes')
], LiveClass);
//# sourceMappingURL=live-class.entity.js.map