import { ClassesService } from './classes.service';
import { CreateClassDto, CreateSessionDto } from './dto/create-class.dto';
export declare class ClassesController {
    private service;
    constructor(service: ClassesService);
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
    create(dto: CreateClassDto): Promise<{
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
    update(id: string, dto: Partial<CreateClassDto>): Promise<{
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
    enroll(id: string, studentId: string): Promise<{
        id: string;
        isActive: boolean;
        studentId: string;
        enrolledAt: Date;
        notes: string | null;
        classId: string;
    }>;
    unenroll(id: string, studentId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getSessions(id: string): Promise<{
        data: {
            id: string;
            notes: string;
            sessionDate: Date;
            startTime: string;
            endTime: string;
            topic: string;
        }[];
    }>;
    createSession(id: string, dto: CreateSessionDto): Promise<{
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
