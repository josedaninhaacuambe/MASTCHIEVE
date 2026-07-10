import { Job } from 'bull';
import { AiService } from '../ai.service';
export declare class FeedbackProcessor {
    private aiService;
    private readonly logger;
    constructor(aiService: AiService);
    handleFeedbackGeneration(job: Job<{
        performanceRecordId: string;
    }>): Promise<{
        success: boolean;
        feedback: string;
    }>;
}
