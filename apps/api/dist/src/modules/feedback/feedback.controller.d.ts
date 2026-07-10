import { FeedbackService } from './feedback.service';
import { RecordPerformanceDto, ReviewFeedbackDto } from './dto/feedback.dto';
export declare class FeedbackController {
    private service;
    constructor(service: FeedbackService);
    recordPerformance(dto: RecordPerformanceDto): Promise<{
        id: string;
        createdAt: Date;
        instructorId: string | null;
        studentId: string;
        sessionId: string | null;
        technique: number | null;
        stamina: number | null;
        speed: number | null;
        coordination: number | null;
        breathing: number | null;
        turns: number | null;
        startDive: number | null;
        overallScore: number | null;
        instructorNotes: string | null;
        acaoCorretiva: string | null;
        rawData: string | null;
        recordedAt: Date;
    }>;
    getMyFeedbacks(userId: string, q: any): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getFeedbacks(query: any): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    reviewFeedback(id: string, dto: ReviewFeedbackDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        instructorId: string | null;
        studentId: string;
        sessionId: string | null;
        instructorNotes: string | null;
        aiGeneratedText: string | null;
        finalText: string | null;
        recommendedLessons: string;
        interactiveExercises: string;
        sentToParentAt: Date | null;
        sentToStudentAt: Date | null;
        aiModel: string | null;
        aiTokensUsed: number | null;
        aiConfidenceScore: number | null;
        performanceRecordId: string | null;
    }>;
    sendFeedback(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        instructorId: string | null;
        studentId: string;
        sessionId: string | null;
        instructorNotes: string | null;
        aiGeneratedText: string | null;
        finalText: string | null;
        recommendedLessons: string;
        interactiveExercises: string;
        sentToParentAt: Date | null;
        sentToStudentAt: Date | null;
        aiModel: string | null;
        aiTokensUsed: number | null;
        aiConfidenceScore: number | null;
        performanceRecordId: string | null;
    }>;
}
