import { PrismaService } from '../../config/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any): Promise<{
        data: ({
            user: {
                email: string;
                role: string;
                lastLoginAt: Date;
            };
            enrollments: ({
                class: {
                    level: string;
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                isActive: boolean;
                studentId: string;
                enrolledAt: Date;
                notes: string | null;
                classId: string;
            })[];
            parents: ({
                parent: {
                    firstName: string;
                    lastName: string;
                    phone: string;
                };
            } & {
                createdAt: Date;
                isPrimary: boolean;
                studentId: string;
                parentId: string;
            })[];
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
            userId: string;
            unidadeId: string | null;
            dateOfBirth: Date;
            gender: string;
            medicalNotes: string | null;
            emergencyContact: string | null;
            emergencyPhone: string | null;
            enrollmentDate: Date;
            autorizacaoImagem: boolean;
            autorizacaoImagemData: Date | null;
            autorizacaoImagemDoc: string | null;
            leadId: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findByUserId(userId: string): Promise<{
        performanceRecords: {
            id: string;
            technique: number;
            stamina: number;
            speed: number;
            coordination: number;
            breathing: number;
            turns: number;
            startDive: number;
            overallScore: number;
            instructorNotes: string;
            recordedAt: Date;
        }[];
        trainingPlans: {
            id: string;
            description: string;
            title: string;
            objectives: string;
            exercises: string;
            aiGenerated: boolean;
            validFrom: Date;
            validUntil: Date;
        }[];
        attendanceStats: {
            total: number;
            present: number;
            rate: number;
        };
        user: {
            email: string;
            role: string;
            lastLoginAt: Date;
        };
        feedbacks: {
            id: string;
            createdAt: Date;
            status: string;
            aiGeneratedText: string;
            finalText: string;
            aiConfidenceScore: number;
        }[];
        enrollments: ({
            class: {
                instructor: {
                    firstName: string;
                    lastName: string;
                };
            } & {
                level: string;
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                maxStudents: number;
                poolLane: string | null;
                schedules: string;
                instructorId: string;
                unidadeId: string | null;
            };
        } & {
            id: string;
            isActive: boolean;
            studentId: string;
            enrolledAt: Date;
            notes: string | null;
            classId: string;
        })[];
        progressRecords: ({
            module: {
                level: string;
                id: string;
                name: string;
                description: string;
                order: number;
                skills: string;
            };
        } & {
            id: string;
            updatedAt: Date;
            status: string;
            studentId: string;
            notes: string | null;
            moduleId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            score: number | null;
        })[];
        payments: {
            id: string;
            status: string;
            notes: string;
            amount: number;
            dueDate: Date;
        }[];
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        userId: string;
        unidadeId: string | null;
        dateOfBirth: Date;
        gender: string;
        medicalNotes: string | null;
        emergencyContact: string | null;
        emergencyPhone: string | null;
        enrollmentDate: Date;
        autorizacaoImagem: boolean;
        autorizacaoImagemData: Date | null;
        autorizacaoImagemDoc: string | null;
        leadId: string | null;
    }>;
    findOne(id: string): Promise<{
        user: {
            email: string;
            role: string;
            lastLoginAt: Date;
        };
        feedbacks: {
            id: string;
            createdAt: Date;
            status: string;
            aiGeneratedText: string;
            finalText: string;
            sentToStudentAt: Date;
            aiConfidenceScore: number;
        }[];
        trainingPlans: {
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
        }[];
        enrollments: ({
            class: {
                instructor: {
                    firstName: string;
                    lastName: string;
                };
            } & {
                level: string;
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                maxStudents: number;
                poolLane: string | null;
                schedules: string;
                instructorId: string;
                unidadeId: string | null;
            };
        } & {
            id: string;
            isActive: boolean;
            studentId: string;
            enrolledAt: Date;
            notes: string | null;
            classId: string;
        })[];
        parents: ({
            parent: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                firstName: string;
                lastName: string;
                phone: string;
                userId: string;
                relationship: string;
            };
        } & {
            createdAt: Date;
            isPrimary: boolean;
            studentId: string;
            parentId: string;
        })[];
        progressRecords: ({
            module: {
                level: string;
                id: string;
                name: string;
                description: string | null;
                order: number;
                skills: string;
                videos: string;
                isActive: boolean;
                createdAt: Date;
            };
        } & {
            id: string;
            updatedAt: Date;
            status: string;
            studentId: string;
            notes: string | null;
            moduleId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            score: number | null;
        })[];
        payments: {
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
        }[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        userId: string;
        unidadeId: string | null;
        dateOfBirth: Date;
        gender: string;
        medicalNotes: string | null;
        emergencyContact: string | null;
        emergencyPhone: string | null;
        enrollmentDate: Date;
        autorizacaoImagem: boolean;
        autorizacaoImagemData: Date | null;
        autorizacaoImagemDoc: string | null;
        leadId: string | null;
    }>;
    create(dto: CreateStudentDto & {
        email?: string;
        password?: string;
    }): Promise<{
        student: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
            userId: string;
            unidadeId: string | null;
            dateOfBirth: Date;
            gender: string;
            medicalNotes: string | null;
            emergencyContact: string | null;
            emergencyPhone: string | null;
            enrollmentDate: Date;
            autorizacaoImagem: boolean;
            autorizacaoImagemData: Date | null;
            autorizacaoImagemDoc: string | null;
            leadId: string | null;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        email: string;
        password: string;
        role: string;
        lastLoginAt: Date | null;
        refreshToken: string | null;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateStudentDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        userId: string;
        unidadeId: string | null;
        dateOfBirth: Date;
        gender: string;
        medicalNotes: string | null;
        emergencyContact: string | null;
        emergencyPhone: string | null;
        enrollmentDate: Date;
        autorizacaoImagem: boolean;
        autorizacaoImagemData: Date | null;
        autorizacaoImagemDoc: string | null;
        leadId: string | null;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        userId: string;
        unidadeId: string | null;
        dateOfBirth: Date;
        gender: string;
        medicalNotes: string | null;
        emergencyContact: string | null;
        emergencyPhone: string | null;
        enrollmentDate: Date;
        autorizacaoImagem: boolean;
        autorizacaoImagemData: Date | null;
        autorizacaoImagemDoc: string | null;
        leadId: string | null;
    }>;
    getPerformanceSummary(studentId: string): Promise<{
        records: {
            id: string;
            technique: number;
            stamina: number;
            speed: number;
            coordination: number;
            breathing: number;
            turns: number;
            startDive: number;
            overallScore: number;
            instructorNotes: string;
            recordedAt: Date;
        }[];
        feedbacks: {
            id: string;
            createdAt: Date;
            status: string;
            aiGeneratedText: string;
            finalText: string;
            sentToStudentAt: Date;
            aiConfidenceScore: number;
        }[];
        progress: ({
            module: {
                level: string;
                id: string;
                name: string;
                description: string | null;
                order: number;
                skills: string;
                videos: string;
                isActive: boolean;
                createdAt: Date;
            };
        } & {
            id: string;
            updatedAt: Date;
            status: string;
            studentId: string;
            notes: string | null;
            moduleId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            score: number | null;
        })[];
        attendance: {
            status: string;
            markedAt: Date;
        }[];
        trainingPlans: {
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
        }[];
        attendanceRate: number;
        avgScore: number;
    }>;
    createPerformanceRecord(studentId: string, userId: string, dto: any): Promise<{
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
}
