import { PrismaService } from '../../config/prisma/prisma.service';
export declare class TrainingPlansController {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any): Promise<{
        data: {
            objectives: any;
            exercises: any;
            instructor: {
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                firstName: string;
                lastName: string;
            };
            id: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            instructorId: string | null;
            studentId: string;
            title: string;
            aiGenerated: boolean;
            validFrom: Date;
            validUntil: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        objectives: any;
        exercises: any;
        instructor: {
            firstName: string;
            lastName: string;
        };
        student: {
            id: string;
            firstName: string;
            lastName: string;
        };
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        instructorId: string | null;
        studentId: string;
        title: string;
        aiGenerated: boolean;
        validFrom: Date;
        validUntil: Date | null;
    }>;
    toggle(id: string): Promise<{
        id: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        instructorId: string | null;
        studentId: string;
        title: string;
        objectives: string;
        exercises: string;
        aiGenerated: boolean;
        validFrom: Date;
        validUntil: Date | null;
    }>;
}
