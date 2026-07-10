import { AvaliacoesIniciaisService } from './avaliacoes-iniciais.service';
export declare class AvaliacoesIniciaisController {
    private readonly svc;
    constructor(svc: AvaliacoesIniciaisService);
    findAll(q: any): import(".prisma/client").Prisma.PrismaPromise<({
        student: {
            firstName: string;
            lastName: string;
        };
        instrutor: {
            firstName: string;
            lastName: string;
        };
        faseRecomendada: {
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
        createdAt: Date;
        data: Date;
        studentId: string;
        observacoes: string | null;
        instrutorId: string;
        experienciaAquatica: number;
        segurancaAdaptacao: number;
        confortoAgua: number;
        resistenciaBasica: number;
        necessidadesEspeciais: string | null;
        faseRecomendadaId: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
    })[]>;
    findByStudent(id: string): import(".prisma/client").Prisma.Prisma__AvaliacaoInicialClient<{
        instrutor: {
            firstName: string;
            lastName: string;
        };
        faseRecomendada: {
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
        createdAt: Date;
        data: Date;
        studentId: string;
        observacoes: string | null;
        instrutorId: string;
        experienciaAquatica: number;
        segurancaAdaptacao: number;
        confortoAgua: number;
        resistenciaBasica: number;
        necessidadesEspeciais: string | null;
        faseRecomendadaId: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
    }, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
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
        instrutor: {
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
        };
        faseRecomendada: {
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
        createdAt: Date;
        data: Date;
        studentId: string;
        observacoes: string | null;
        instrutorId: string;
        experienciaAquatica: number;
        segurancaAdaptacao: number;
        confortoAgua: number;
        resistenciaBasica: number;
        necessidadesEspeciais: string | null;
        faseRecomendadaId: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
    }>;
    create(body: any, req: any): import(".prisma/client").Prisma.Prisma__AvaliacaoInicialClient<{
        id: string;
        createdAt: Date;
        data: Date;
        studentId: string;
        observacoes: string | null;
        instrutorId: string;
        experienciaAquatica: number;
        segurancaAdaptacao: number;
        confortoAgua: number;
        resistenciaBasica: number;
        necessidadesEspeciais: string | null;
        faseRecomendadaId: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        data: Date;
        studentId: string;
        observacoes: string | null;
        instrutorId: string;
        experienciaAquatica: number;
        segurancaAdaptacao: number;
        confortoAgua: number;
        resistenciaBasica: number;
        necessidadesEspeciais: string | null;
        faseRecomendadaId: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
    }>;
    aprovar(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        data: Date;
        studentId: string;
        observacoes: string | null;
        instrutorId: string;
        experienciaAquatica: number;
        segurancaAdaptacao: number;
        confortoAgua: number;
        resistenciaBasica: number;
        necessidadesEspeciais: string | null;
        faseRecomendadaId: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
    }>;
}
