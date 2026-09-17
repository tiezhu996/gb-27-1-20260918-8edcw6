import { AssignmentsService } from './assignments.service';
export declare class AssignmentsController {
    private readonly assignmentsService;
    constructor(assignmentsService: AssignmentsService);
    findByCourse(courseId: string): Promise<import("../../common/entities/assignment.entity").Assignment[]>;
    create(req: any, data: any): Promise<import("../../common/entities/assignment.entity").Assignment>;
    findOne(id: string): Promise<import("../../common/entities/assignment.entity").Assignment>;
    submit(assignmentId: string, data: any, req: any): Promise<import("../../common/entities/assignment-submission.entity").AssignmentSubmission>;
    findMySubmission(assignmentId: string, req: any): Promise<import("../../common/entities/assignment-submission.entity").AssignmentSubmission>;
    findSubmissions(assignmentId: string): Promise<import("../../common/entities/assignment-submission.entity").AssignmentSubmission[]>;
    grade(submissionId: string, body: {
        score: number;
        feedback: string;
    }, req: any): Promise<import("../../common/entities/assignment-submission.entity").AssignmentSubmission>;
}
