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
exports.StatisticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const course_entity_1 = require("../../common/entities/course.entity");
const course_enrollment_entity_1 = require("../../common/entities/course-enrollment.entity");
const assignment_entity_1 = require("../../common/entities/assignment.entity");
const assignment_submission_entity_1 = require("../../common/entities/assignment-submission.entity");
const attendance_record_entity_1 = require("../../common/entities/attendance-record.entity");
let StatisticsService = class StatisticsService {
    constructor(courseRepository, enrollmentRepository, assignmentRepository, submissionRepository, attendanceRepository) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.attendanceRepository = attendanceRepository;
    }
    async getTeacherStats(teacherId) {
        const courses = await this.courseRepository.find({
            where: { teacherId },
        });
        const courseIds = courses.map(c => c.id);
        const totalSales = await this.enrollmentRepository.count({
            where: { courseId: (0, typeorm_2.In)(courseIds) },
        });
        const totalRevenue = courses.reduce((sum, course) => {
            if (course.type === 'paid' && course.price) {
                return sum;
            }
            return sum;
        }, 0);
        const attendanceRecords = await this.attendanceRepository.find({
            where: { status: attendance_record_entity_1.AttendanceStatus.PRESENT },
        });
        const totalAssignments = await this.assignmentRepository.count({
            where: { teacherId },
        });
        const submissions = await this.submissionRepository.find({
            where: { status: assignment_submission_entity_1.SubmissionStatus.GRADED },
        });
        const avgScore = submissions.length > 0
            ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
            : 0;
        return {
            totalCourses: courses.length,
            totalSales,
            totalRevenue,
            attendanceRate: attendanceRecords.length > 0 ? 100 : 0,
            totalAssignments,
            averageScore: Math.round(avgScore),
        };
    }
    async getStudentStats(studentId) {
        const enrollments = await this.enrollmentRepository.find({
            where: { studentId },
            relations: ['course'],
        });
        const courseIds = enrollments.map(e => e.courseId);
        const assignments = await this.assignmentRepository.find({
            where: { courseId: (0, typeorm_2.In)(courseIds) },
        });
        const submissions = await this.submissionRepository.find({
            where: { studentId, status: assignment_submission_entity_1.SubmissionStatus.GRADED },
        });
        const attendanceRecords = await this.attendanceRepository.find({
            where: { studentId },
        });
        const totalStudyHours = enrollments.reduce((sum, e) => {
            return sum + (e.progress || 0);
        }, 0);
        const avgScore = submissions.length > 0
            ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length
            : 0;
        const completedCourses = enrollments.filter(e => e.status === course_enrollment_entity_1.EnrollmentStatus.COMPLETED).length;
        return {
            totalCourses: enrollments.length,
            completedCourses,
            totalStudyHours: Math.round(totalStudyHours / 60),
            totalAssignments: assignments.length,
            completedAssignments: submissions.length,
            averageScore: Math.round(avgScore),
            attendanceRecords: attendanceRecords.length,
        };
    }
};
exports.StatisticsService = StatisticsService;
exports.StatisticsService = StatisticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(course_entity_1.Course)),
    __param(1, (0, typeorm_1.InjectRepository)(course_enrollment_entity_1.CourseEnrollment)),
    __param(2, (0, typeorm_1.InjectRepository)(assignment_entity_1.Assignment)),
    __param(3, (0, typeorm_1.InjectRepository)(assignment_submission_entity_1.AssignmentSubmission)),
    __param(4, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StatisticsService);
//# sourceMappingURL=statistics.service.js.map