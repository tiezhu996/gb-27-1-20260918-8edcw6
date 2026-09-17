import { Repository } from 'typeorm';
import { LiveClass } from '../../common/entities/live-class.entity';
export declare class LiveClassesService {
    private readonly liveClassRepository;
    constructor(liveClassRepository: Repository<LiveClass>);
    findAll(): Promise<LiveClass[]>;
    findOne(id: string): Promise<LiveClass>;
    create(userId: string, data: Partial<LiveClass>): Promise<LiveClass>;
    startLive(userId: string, id: string): Promise<LiveClass>;
    endLive(userId: string, id: string): Promise<LiveClass>;
    updateParticipants(id: string, count: number): Promise<LiveClass>;
}
