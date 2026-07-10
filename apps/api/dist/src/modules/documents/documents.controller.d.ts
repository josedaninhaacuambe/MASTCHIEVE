import { DocumentsService } from './documents.service';
export declare class DocumentsController {
    private service;
    constructor(service: DocumentsService);
    findByStudent(studentId: string): Promise<{
        id: string;
        name: string;
        studentId: string;
        type: string;
        url: string;
        size: number | null;
        uploadedAt: Date;
    }[]>;
    upload(studentId: string, file: Express.Multer.File, type: string): Promise<{
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
