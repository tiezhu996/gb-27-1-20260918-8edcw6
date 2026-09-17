import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    checkIn(body: {
        liveClassId: string;
    }, req: any): Promise<import("../../common/entities/attendance-record.entity").AttendanceRecord>;
    getRecordsByLiveClass(liveClassId: string): Promise<import("../../common/entities/attendance-record.entity").AttendanceRecord[]>;
    getMyRecords(courseId: string, req: any): Promise<import("../../common/entities/attendance-record.entity").AttendanceRecord[]>;
}
