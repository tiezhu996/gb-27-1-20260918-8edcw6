import { Repository } from 'typeorm';
import { Assignment } from '../../common/entities/assignment.entity';
import { AssignmentSubmission } from '../../common/entities/assignment-submission.entity';
export declare class AssignmentsService {
    private readonly assignmentRepository;
    private readonly submissionRepository;
    constructor(assignmentRepository: Repository<Assignment>, submissionRepository: Repository<AssignmentSubmission>);
    findByCourse(courseId: string): Promise<Assignment[]>;
    findOne(id: string): Promise<Assignment>;
    create(userId: string, data: Partial<Assignment>): Promise<Assignment>;
    submit(studentId: string, assignmentId: string, data: Partial<AssignmentSubmission>): Promise<AssignmentSubmission>;
    grade(teacherId: string, submissionId: string, score: number, feedback: string): Promise<AssignmentSubmission>;
    findSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]>;
    findMySubmission(studentId: string, assignmentId: string): Promise<AssignmentSubmission>;
}
