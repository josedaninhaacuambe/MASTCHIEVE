import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { PrismaService } from '../../config/prisma/prisma.service';
export declare class AiService {
    private config;
    private prisma;
    private feedbackQueue;
    private readonly logger;
    private readonly anthropic;
    private readonly model;
    constructor(config: ConfigService, prisma: PrismaService, feedbackQueue: Queue);
    queueFeedbackGeneration(performanceRecordId: string, priority?: number): Promise<{
        jobId: import("bull").JobId;
        status: string;
    }>;
    generateFeedback(performanceRecordId: string): Promise<string>;
    generateTrainingPlan(studentId: string, instructorNotes?: string): Promise<any>;
    private getSystemPrompt;
    private buildFeedbackPrompt;
    private calculateConfidence;
}
