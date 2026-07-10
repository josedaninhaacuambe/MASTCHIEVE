import { InstructorsService } from './instructors.service';
declare class NotifyDto {
    title: string;
    body: string;
}
export declare class InstructorsController {
    private service;
    constructor(service: InstructorsService);
    findAll(query: any): Promise<{
        data: {
            specializations: any;
            classCount: number;
            feedbackCount: number;
            user: {
                id: string;
                isActive: boolean;
                email: string;
                lastLoginAt: Date;
            };
            classes: {
                level: string;
                id: string;
                name: string;
            }[];
            _count: {
                feedbacks: number;
            };
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
            userId: string;
            bio: string | null;
            hireDate: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        specializations: any;
        feedbackCount: number;
        classes: {
            schedules: any;
            enrolledCount: number;
            enrollments: {
                id: string;
            }[];
            _count: {
                enrollments: number;
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
        user: {
            id: string;
            isActive: boolean;
            email: string;
            lastLoginAt: Date;
        };
        feedbacks: {
            id: string;
            createdAt: Date;
            status: string;
        }[];
        _count: {
            feedbacks: number;
        };
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        userId: string;
        bio: string | null;
        hireDate: Date;
    }>;
    update(id: string, dto: any): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        userId: string;
        specializations: string;
        bio: string | null;
        hireDate: Date;
    }>;
    toggle(id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
    notify(id: string, dto: NotifyDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: string | null;
        title: string;
        type: string;
        body: string;
        readAt: Date | null;
    }>;
    getStats(id: string): Promise<{
        classes: number;
        feedbacks: number;
        students: number;
        feedbacksByMonth: {
            month: string;
            count: number;
        }[];
        recentMonthFeedbacks: number;
    }>;
}
export {};
