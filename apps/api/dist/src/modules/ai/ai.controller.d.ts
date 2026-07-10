import { AiService } from './ai.service';
declare class GenerateFeedbackDto {
    performanceRecordId: string;
}
declare class GenerateTrainingPlanDto {
    instructorNotes?: string;
}
export declare class AiController {
    private aiService;
    constructor(aiService: AiService);
    queueFeedback(dto: GenerateFeedbackDto): Promise<{
        jobId: import("bull").JobId;
        status: string;
    }>;
    generateFeedback(recordId: string): Promise<string>;
    generateTrainingPlan(studentId: string, dto: GenerateTrainingPlanDto): Promise<any>;
}
export {};
