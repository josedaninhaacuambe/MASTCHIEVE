import { SwimmingModulesService } from './swimming-modules.service';
import { CreateSwimmingModuleDto, UpdateProgressDto } from './dto/swimming-module.dto';
export declare class SwimmingModulesController {
    private service;
    constructor(service: SwimmingModulesService);
    findAll(query: any): Promise<{
        skills: any[];
        videos: any[];
        progressStats: {
            total: number;
            completed: number;
            inProgress: number;
        };
        progress: any;
        level: string;
        id: string;
        name: string;
        description: string | null;
        order: number;
        isActive: boolean;
        createdAt: Date;
    }[]>;
    getProgress(studentId: string): Promise<{
        skills: any[];
        videos: any[];
        progress: {
            id: string;
            updatedAt: Date;
            status: string;
            studentId: string;
            notes: string | null;
            moduleId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            score: number | null;
        } | {
            status: string;
            startedAt: any;
            completedAt: any;
            notes: any;
        };
        level: string;
        id: string;
        name: string;
        description: string | null;
        order: number;
        isActive: boolean;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        skills: any[];
        videos: any[];
        progress: ({
            student: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            updatedAt: Date;
            status: string;
            studentId: string;
            notes: string | null;
            moduleId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            score: number | null;
        })[];
        level: string;
        id: string;
        name: string;
        description: string | null;
        order: number;
        isActive: boolean;
        createdAt: Date;
    }>;
    create(dto: CreateSwimmingModuleDto): Promise<{
        level: string;
        id: string;
        name: string;
        description: string | null;
        order: number;
        skills: string;
        videos: string;
        isActive: boolean;
        createdAt: Date;
    }>;
    update(id: string, dto: Partial<CreateSwimmingModuleDto>): Promise<{
        level: string;
        id: string;
        name: string;
        description: string | null;
        order: number;
        skills: string;
        videos: string;
        isActive: boolean;
        createdAt: Date;
    }>;
    patch(id: string, dto: Partial<CreateSwimmingModuleDto>): Promise<{
        level: string;
        id: string;
        name: string;
        description: string | null;
        order: number;
        skills: string;
        videos: string;
        isActive: boolean;
        createdAt: Date;
    }>;
    remove(id: string): Promise<{
        level: string;
        id: string;
        name: string;
        description: string | null;
        order: number;
        skills: string;
        videos: string;
        isActive: boolean;
        createdAt: Date;
    }>;
    addVideo(id: string, body: {
        title: string;
        url: string;
        description?: string;
    }): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        title: string;
        url: string;
        description: string;
        source: string;
        youtubeId: string;
        addedAt: string;
    }>;
    removeVideo(id: string, videoId: string): Promise<{
        deleted: boolean;
    }>;
    updateProgress(studentId: string, moduleId: string, dto: UpdateProgressDto): Promise<{
        id: string;
        updatedAt: Date;
        status: string;
        studentId: string;
        notes: string | null;
        moduleId: string;
        startedAt: Date | null;
        completedAt: Date | null;
        score: number | null;
    }>;
}
