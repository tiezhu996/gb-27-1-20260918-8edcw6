import { Repository } from 'typeorm';
import { AttendanceRecord } from '../../common/entities/attendance-record.entity';
import { LiveClass } from '../../common/entities/live-class.entity';
export declare class AttendanceService {
    private readonly attendanceRepository;
    private readonly liveClassRepository;
    constructor(attendanceRepository: Repository<AttendanceRecord>, liveClassRepository: Repository<LiveClass>);
    checkIn(studentId: string, liveClassId: string): Promise<AttendanceRecord>;
    getRecordsByLiveClass(liveClassId: string): Promise<AttendanceRecord[]>;
    getMyRecords(studentId: string, courseId?: string): Promise<AttendanceRecord[]>;
}
