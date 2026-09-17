import { Repository } from 'typeorm';
import { Course } from '../../common/entities/course.entity';
import { CourseEnrollment } from '../../common/entities/course-enrollment.entity';
import { Assignment } from '../../common/entities/assignment.entity';
import { AssignmentSubmission } from '../../common/entities/assignment-submission.entity';
import { AttendanceRecord } from '../../common/entities/attendance-record.entity';
export declare class StatisticsService {
    private readonly courseRepository;
    private readonly enrollmentRepository;
    private readonly assignmentRepository;
    private readonly submissionRepository;
    private readonly attendanceRepository;
    constructor(courseRepository: Repository<Course>, enrollmentRepository: Repository<CourseEnrollment>, assignmentRepository: Repository<Assignment>, submissionRepository: Repository<AssignmentSubmission>, attendanceRepository: Repository<AttendanceRecord>);
    getTeacherStats(teacherId: string): Promise<{
        totalCourses: number;
        totalSales: number;
        totalRevenue: number;
        attendanceRate: number;
        totalAssignments: number;
        averageScore: number;
    }>;
    getStudentStats(studentId: string): Promise<{
        totalCourses: number;
        completedCourses: number;
        totalStudyHours: number;
        totalAssignments: number;
        completedAssignments: number;
        averageScore: number;
        attendanceRecords: number;
    }>;
}
