import { PrismaService } from '../../config/prisma/prisma.service';
export declare class DocumentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findByStudent(studentId: string): Promise<{
        id: string;
        name: string;
        studentId: string;
        type: string;
        url: string;
        size: number | null;
        uploadedAt: Date;
    }[]>;
    create(studentId: string, file: Express.Multer.File, type: string): Promise<{
        id: string;
        name: string;
        studentId: string;
        type: string;
        url: string;
        size: number | null;
        uploadedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        studentId: string;
        type: string;
        url: string;
        size: number | null;
        uploadedAt: Date;
    }>;
}
