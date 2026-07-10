import { KpiService } from './kpi.service';
export declare class KpiController {
    private kpiService;
    constructor(kpiService: KpiService);
    getDashboard(): Promise<{
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
    getAttendance(days: number): Promise<{
        total: number;
        present: number;
        rate: number;
    }>;
    getAdoption(): Promise<{
        total: number;
        active: number;
        rate: number;
    }>;
    getHistory(days: number): Promise<{
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
    getStudentTrend(studentId: string): Promise<{
        technique: number;
        stamina: number;
        speed: number;
        coordination: number;
        overallScore: number;
        recordedAt: Date;
    }[]>;
}
