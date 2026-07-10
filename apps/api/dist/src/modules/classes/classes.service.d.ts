import { PrismaService } from '../../config/prisma/prisma.service';
export declare class ClassesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: any): Promise<{
        data: {
            schedules: any;
            enrolledCount: number;
            enrollments: any;
            instructor: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string;
            };
            level: string;
            id: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            maxStudents: number;
            poolLane: string | null;
            instructorId: string;
            unidadeId: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        schedules: any;
        enrolledCount: number;
        instructor: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string;
            specializations: string;
            bio: string;
        };
        enrollments: ({
            student: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string;
                gender: string;
            };
        } & {
            id: string;
            isActive: boolean;
            studentId: string;
            enrolledAt: Date;
            notes: string | null;
            classId: string;
        })[];
        sessions: {
            id: string;
            sessionDate: Date;
            startTime: string;
            endTime: string;
            topic: string;
        }[];
        level: string;
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        maxStudents: number;
        poolLane: string | null;
        instructorId: string;
        unidadeId: string | null;
    }>;
    create(dto: any): Promise<{
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
    }>;
    update(id: string, dto: any): Promise<{
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
    }>;
    enroll(classId: string, studentId: string): Promise<{
        id: string;
        isActive: boolean;
        studentId: string;
        enrolledAt: Date;
        notes: string | null;
        classId: string;
    }>;
    unenroll(classId: string, studentId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getSessions(classId: string): Promise<{
        data: {
            id: string;
            notes: string;
            sessionDate: Date;
            startTime: string;
            endTime: string;
            topic: string;
        }[];
    }>;
    createSession(classId: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        notes: string | null;
        classId: string;
        sessionDate: Date;
        startTime: string;
        endTime: string;
        topic: string | null;
        checklistEquipamentos: boolean;
        checklistSeguranca: boolean;
    }>;
}
