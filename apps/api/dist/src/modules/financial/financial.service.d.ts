import { PrismaService } from '../../config/prisma/prisma.service';
import { EmailService } from '../email/email.service';
export declare class FinancialService {
    private prisma;
    private email;
    private readonly logger;
    constructor(prisma: PrismaService, email: EmailService);
    getPayments(query: any): Promise<{
        data: ({
            student: {
                firstName: string;
                lastName: string;
            };
            monthlyFee: {
                month: number;
                year: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            studentId: string;
            notes: string | null;
            amount: number;
            dueDate: Date;
            monthlyFeeId: string | null;
            receiptNumber: string | null;
            method: string;
            reference: string | null;
            paidAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getMyPayments(userId: string, query?: any): Promise<{
        data: ({
            monthlyFee: {
                month: number;
                year: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            studentId: string;
            notes: string | null;
            amount: number;
            dueDate: Date;
            monthlyFeeId: string | null;
            receiptNumber: string | null;
            method: string;
            reference: string | null;
            paidAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            years: number[];
        };
    }>;
    createPayment(dto: any): Promise<{
        student: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        studentId: string;
        notes: string | null;
        amount: number;
        dueDate: Date;
        monthlyFeeId: string | null;
        receiptNumber: string | null;
        method: string;
        reference: string | null;
        paidAt: Date | null;
    }>;
    markAsPaid(id: string, method: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        studentId: string;
        notes: string | null;
        amount: number;
        dueDate: Date;
        monthlyFeeId: string | null;
        receiptNumber: string | null;
        method: string;
        reference: string | null;
        paidAt: Date | null;
    }>;
    generateMonthlyFees(month: number, year: number, amount: number): Promise<{
        created: number;
        total: number;
        month: number;
        year: number;
    }>;
    getFinancialSummary(year: number): Promise<{
        totalRevenue: number;
        overduePayments: number;
        pendingAmount: number;
        pendingCount: number;
    }>;
    getStudentBalance(studentId: string): Promise<{
        paidAmount: number;
        pendingAmount: number;
        overdueAmount: number;
        pendingCount: number;
        overdueCount: number;
    }>;
    sendReminders(): Promise<{
        sent: number;
        total: number;
    }>;
    exportPdf(year: number): Promise<Buffer>;
    markOverduePayments(): Promise<void>;
}
