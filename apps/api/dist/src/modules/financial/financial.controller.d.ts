import type { Response } from 'express';
import { FinancialService } from './financial.service';
export declare class FinancialController {
    private service;
    constructor(service: FinancialService);
    getMyPayments(userId: string, q: any): Promise<{
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
    generateMonthlyFees(body: {
        month: number;
        year: number;
        amount: number;
    }): Promise<{
        created: number;
        total: number;
        month: number;
        year: number;
    }>;
    getSummary(year: number): Promise<{
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
    exportPdf(year: string, res: Response): Promise<void>;
}
