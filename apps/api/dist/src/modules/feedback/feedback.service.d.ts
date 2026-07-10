import { PrismaService } from '../../config/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../../common/audit/audit.service';
import { EmailService } from '../email/email.service';
export declare class FeedbackService {
    private prisma;
    private aiService;
    private audit;
    private email;
    constructor(prisma: PrismaService, aiService: AiService, audit: AuditService, email: EmailService);
    recordPerformance(dto: any): Promise<{
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
    getFeedbacks(query: any): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getMyFeedbacks(userId: string, query?: any): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<any>;
    private parseJsonField;
    private normalizeFeedback;
    reviewFeedback(id: string, instructorNotes: string, approve: boolean): Promise<{
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
    sendFeedback(id: string, userId?: string): Promise<{
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
    private calculateOverall;
}
