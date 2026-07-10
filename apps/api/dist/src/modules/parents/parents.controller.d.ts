import { ParentsService } from './parents.service';
export declare class ParentsController {
    private service;
    constructor(service: ParentsService);
    findAll(query: any): Promise<{
        data: {
            childrenCount: number;
            user: {
                isActive: boolean;
                email: string;
                lastLoginAt: Date;
            };
            children: ({
                student: {
                    id: string;
                    isActive: boolean;
                    firstName: string;
                    lastName: string;
                };
            } & {
                createdAt: Date;
                isPrimary: boolean;
                studentId: string;
                parentId: string;
            })[];
            id: string;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string;
            userId: string;
            relationship: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findMe(req: any): Promise<{
        user: {
            email: string;
        };
        children: ({
            student: {
                feedbacks: {
                    id: string;
                    createdAt: Date;
                    status: string;
                    aiGeneratedText: string;
                }[];
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
                payments: {
                    id: string;
                    status: string;
                    amount: number;
                    dueDate: Date;
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
            };
        } & {
            createdAt: Date;
            isPrimary: boolean;
            studentId: string;
            parentId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string;
        userId: string;
        relationship: string;
    }>;
    getChildDetail(req: any, studentId: string): Promise<{
        attendanceStats: {
            total: number;
            present: number;
            rate: number;
        };
        attendances: {
            id: string;
            status: string;
            markedAt: Date;
            session: {
                sessionDate: Date;
                startTime: string;
            };
        }[];
        feedbacks: {
            id: string;
            createdAt: Date;
            status: string;
            aiGeneratedText: string;
            finalText: string;
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
                name: string;
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
            amount: number;
            dueDate: Date;
            method: string;
            paidAt: Date;
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
            id: string;
            email: string;
            lastLoginAt: Date;
        };
        children: ({
            student: {
                id: string;
                firstName: string;
                lastName: string;
                enrollments: ({
                    class: {
                        level: string;
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
            };
        } & {
            createdAt: Date;
            isPrimary: boolean;
            studentId: string;
            parentId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string;
        userId: string;
        relationship: string;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string;
        userId: string;
        relationship: string;
    }>;
}
