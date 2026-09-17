import { StatisticsService } from './statistics.service';
export declare class StatisticsController {
    private readonly statisticsService;
    constructor(statisticsService: StatisticsService);
    getMyStats(req: any): Promise<{
        totalCourses: number;
        totalSales: number;
        totalRevenue: number;
        attendanceRate: number;
        totalAssignments: number;
        averageScore: number;
    }> | Promise<{
        totalCourses: number;
        completedCourses: number;
        totalStudyHours: number;
        totalAssignments: number;
        completedAssignments: number;
        averageScore: number;
        attendanceRecords: number;
    }>;
}
