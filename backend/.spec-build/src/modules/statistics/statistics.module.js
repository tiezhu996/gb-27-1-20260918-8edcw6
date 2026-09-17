"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const course_entity_1 = require("../../common/entities/course.entity");
const course_enrollment_entity_1 = require("../../common/entities/course-enrollment.entity");
const assignment_entity_1 = require("../../common/entities/assignment.entity");
const assignment_submission_entity_1 = require("../../common/entities/assignment-submission.entity");
const attendance_record_entity_1 = require("../../common/entities/attendance-record.entity");
const statistics_controller_1 = require("./statistics.controller");
const statistics_service_1 = require("./statistics.service");
let StatisticsModule = class StatisticsModule {
};
exports.StatisticsModule = StatisticsModule;
exports.StatisticsModule = StatisticsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([course_entity_1.Course, course_enrollment_entity_1.CourseEnrollment, assignment_entity_1.Assignment, assignment_submission_entity_1.AssignmentSubmission, attendance_record_entity_1.AttendanceRecord])],
        controllers: [statistics_controller_1.StatisticsController],
        providers: [statistics_service_1.StatisticsService],
    })
], StatisticsModule);
//# sourceMappingURL=statistics.module.js.map