import { Assignment } from './assignment.entity';
import { User } from './user.entity';
export declare enum SubmissionStatus {
    SUBMITTED = "submitted",
    GRADED = "graded"
}
export declare class AssignmentSubmission {
    id: string;
    assignmentId: string;
    studentId: string;
    textAnswer: string;
    choiceAnswers: any;
    attachmentUrls: string[];
    status: SubmissionStatus;
    score: number;
    feedback: string;
    gradedAt: Date;
    assignment: Assignment;
    student: User;
    createdAt: Date;
    updatedAt: Date;
}
