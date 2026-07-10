import { FasesService } from './fases.service';
export declare class FasesController {
    private readonly svc;
    constructor(svc: FasesService);
    findAll(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        nome: string;
        descricao: string | null;
        nivel: string;
        ordem: number;
        animal: string;
        certificacao: string;
        criterios: string;
        assiduidade: number;
    }[]>;
    seed(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        nome: string;
        descricao: string | null;
        nivel: string;
        ordem: number;
        animal: string;
        certificacao: string;
        criterios: string;
        assiduidade: number;
    }[]>;
    findOne(id: string): Promise<{
        studentFases: ({
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
            updatedAt: Date;
            studentId: string;
            estado: string;
            notas: string | null;
            faseId: string;
            iniciadoEm: Date | null;
            concluidoEm: Date | null;
            pontuacao: number | null;
        })[];
        certificados: {
            id: string;
            createdAt: Date;
            studentId: string;
            eventoId: string | null;
            faseId: string;
            dataEmissao: Date;
            validadoPorId: string;
            numeroSerie: string;
            observacoes: string | null;
        }[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        nome: string;
        descricao: string | null;
        nivel: string;
        ordem: number;
        animal: string;
        certificacao: string;
        criterios: string;
        assiduidade: number;
    }>;
    progressoAtleta(sid: string): Promise<{
        progresso: ({
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
                criterios: string;
                assiduidade: number;
            };
        } & {
            id: string;
            updatedAt: Date;
            studentId: string;
            estado: string;
            notas: string | null;
            faseId: string;
            iniciadoEm: Date | null;
            concluidoEm: Date | null;
            pontuacao: number | null;
        }) | {
            estado: string;
        };
        id: string;
        isActive: boolean;
        createdAt: Date;
        nome: string;
        descricao: string | null;
        nivel: string;
        ordem: number;
        animal: string;
        certificacao: string;
        criterios: string;
        assiduidade: number;
    }[]>;
    updateProgresso(sid: string, fid: string, body: any): Promise<{
        id: string;
        updatedAt: Date;
        studentId: string;
        estado: string;
        notas: string | null;
        faseId: string;
        iniciadoEm: Date | null;
        concluidoEm: Date | null;
        pontuacao: number | null;
    }>;
}
