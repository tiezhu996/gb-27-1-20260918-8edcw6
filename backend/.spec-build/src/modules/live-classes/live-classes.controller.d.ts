import { LiveClassesService } from './live-classes.service';
export declare class LiveClassesController {
    private readonly liveClassesService;
    constructor(liveClassesService: LiveClassesService);
    findAll(): Promise<import("../../common/entities/live-class.entity").LiveClass[]>;
    create(req: any, data: any): Promise<import("../../common/entities/live-class.entity").LiveClass>;
    findOne(id: string): Promise<import("../../common/entities/live-class.entity").LiveClass>;
    startLive(id: string, req: any): Promise<import("../../common/entities/live-class.entity").LiveClass>;
    endLive(id: string, req: any): Promise<import("../../common/entities/live-class.entity").LiveClass>;
}
