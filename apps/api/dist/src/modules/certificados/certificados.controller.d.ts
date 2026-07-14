import { CertificadosService } from './certificados.service';
export declare class CertificadosController {
    private readonly svc;
    constructor(svc: CertificadosService);
    findAll(q: any): import(".prisma/client").Prisma.PrismaPromise<({
        student: {
            firstName: string;
            lastName: string;
        };
        fase: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            nome: string;
            descricao: string | null;
            nivel: string;
            ordem: number;
            animal: string;
            certificacao: string;
            foco: string | null;
            escala: string;
            criterios: string;
            assiduidade: number;
        };
        validadoPor: {
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        studentId: string;
        eventoId: string | null;
        faseId: string;
        dataEmissao: Date;
        validadoPorId: string;
        numeroSerie: string;
        observacoes: string | null;
    })[]>;
    findOne(id: string): Promise<{
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
        evento: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            data: Date;
            unidadeId: string | null;
            nome: string;
            tipo: string;
            estado: string;
            notas: string | null;
            programa: string | null;
            capacidade: number | null;
        };
        fase: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            nome: string;
            descricao: string | null;
            nivel: string;
            ordem: number;
            animal: string;
            certificacao: string;
            foco: string | null;
            escala: string;
            criterios: string;
            assiduidade: number;
        };
        validadoPor: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            email: string;
            password: string;
            role: string;
            lastLoginAt: Date | null;
            refreshToken: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        studentId: string;
        eventoId: string | null;
        faseId: string;
        dataEmissao: Date;
        validadoPorId: string;
        numeroSerie: string;
        observacoes: string | null;
    }>;
    findByAtleta(id: string): import(".prisma/client").Prisma.PrismaPromise<({
        evento: {
            data: Date;
            nome: string;
        };
        fase: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            nome: string;
            descricao: string | null;
            nivel: string;
            ordem: number;
            animal: string;
            certificacao: string;
            foco: string | null;
            escala: string;
            criterios: string;
            assiduidade: number;
        };
    } & {
        id: string;
        createdAt: Date;
        studentId: string;
        eventoId: string | null;
        faseId: string;
        dataEmissao: Date;
        validadoPorId: string;
        numeroSerie: string;
        observacoes: string | null;
    })[]>;
    create(body: any, req: any): Promise<{
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
        fase: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            nome: string;
            descricao: string | null;
            nivel: string;
            ordem: number;
            animal: string;
            certificacao: string;
            foco: string | null;
            escala: string;
            criterios: string;
            assiduidade: number;
        };
    } & {
        id: string;
        createdAt: Date;
        studentId: string;
        eventoId: string | null;
        faseId: string;
        dataEmissao: Date;
        validadoPorId: string;
        numeroSerie: string;
        observacoes: string | null;
    }>;
}
