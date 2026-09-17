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
exports.AssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const assignment_entity_1 = require("../../common/entities/assignment.entity");
const assignment_submission_entity_1 = require("../../common/entities/assignment-submission.entity");
let AssignmentsService = class AssignmentsService {
    constructor(assignmentRepository, submissionRepository) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
    }
    async findByCourse(courseId) {
        return this.assignmentRepository.find({
            where: { courseId },
            relations: ['teacher'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const assignment = await this.assignmentRepository.findOne({
            where: { id },
            relations: ['teacher', 'lesson'],
        });
        if (!assignment) {
            throw new common_1.NotFoundException('作业不存在');
        }
        return assignment;
    }
    async create(userId, data) {
        const assignment = this.assignmentRepository.create({
            ...data,
            teacherId: userId,
        });
        return this.assignmentRepository.save(assignment);
    }
    async submit(studentId, assignmentId, data) {
        const existingSubmission = await this.submissionRepository.findOne({
            where: { studentId, assignmentId },
        });
        if (existingSubmission) {
            Object.assign(existingSubmission, data);
            return this.submissionRepository.save(existingSubmission);
        }
        const submission = this.submissionRepository.create({
            ...data,
            studentId,
            assignmentId,
            status: assignment_submission_entity_1.SubmissionStatus.SUBMITTED,
        });
        return this.submissionRepository.save(submission);
    }
    async grade(teacherId, submissionId, score, feedback) {
        const submission = await this.submissionRepository.findOne({
            where: { id: submissionId },
            relations: ['assignment'],
        });
        if (!submission) {
            throw new common_1.NotFoundException('提交不存在');
        }
        if (submission.assignment.teacherId !== teacherId) {
            throw new common_1.ForbiddenException('无权批改此作业');
        }
        submission.score = score;
        submission.feedback = feedback;
        submission.status = assignment_submission_entity_1.SubmissionStatus.GRADED;
        submission.gradedAt = new Date();
        return this.submissionRepository.save(submission);
    }
    async findSubmissionsByAssignment(assignmentId) {
        return this.submissionRepository.find({
            where: { assignmentId },
            relations: ['student'],
            order: { createdAt: 'DESC' },
        });
    }
    async findMySubmission(studentId, assignmentId) {
        return this.submissionRepository.findOne({
            where: { studentId, assignmentId },
        });
    }
};
exports.AssignmentsService = AssignmentsService;
exports.AssignmentsService = AssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(assignment_entity_1.Assignment)),
    __param(1, (0, typeorm_1.InjectRepository)(assignment_submission_entity_1.AssignmentSubmission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AssignmentsService);
//# sourceMappingURL=assignments.service.js.map