import { PrismaService } from '../../config/prisma/prisma.service';
export declare class KpiService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getDashboardKpis(): Promise<{
        students: {
            total: number;
            active: number;
        };
        instructors: number;
        classes: number;
        overduePayments: number;
        monthlyRevenue: number;
        attendanceRate: number;
        recentFeedbacks: {
            id: string;
            createdAt: Date;
            student: {
                firstName: string;
                lastName: string;
            };
            status: string;
            aiGeneratedText: string;
            aiConfidenceScore: number;
        }[];
        moduleProgress: any;
    }>;
    getAttendanceStats(days?: number): Promise<{
        total: number;
        present: number;
        rate: number;
    }>;
    getModuleProgressStats(): Promise<any>;
    getStudentProgressTrend(studentId: string): Promise<{
        technique: number;
        stamina: number;
        speed: number;
        coordination: number;
        overallScore: number;
        recordedAt: Date;
    }[]>;
    getInstructorAdoptionRate(): Promise<{
        total: number;
        active: number;
        rate: number;
    }>;
    snapshotKpis(): Promise<void>;
    getKpiHistory(days?: number): Promise<{
        id: string;
        createdAt: Date;
        unidadeId: string | null;
        snapshotDate: Date;
        totalStudents: number;
        activeStudents: number;
        totalInstructors: number;
        totalClasses: number;
        attendanceRate: number;
        avgFeedbackScore: number | null;
        npsScore: number | null;
        instructorAdoptionRate: number | null;
        overduePayments: number;
        monthlyRevenue: number | null;
        leadsGerados: number | null;
        conversaoLead: number | null;
        incidentesCount: number;
        participacaoOpenDay: number | null;
    }[]>;
}
