import { LeadsService } from './leads.service';
export declare class LeadsController {
    private readonly svc;
    constructor(svc: LeadsService);
    findAll(q: any): import(".prisma/client").Prisma.PrismaPromise<({
        unidade: {
            nome: string;
            codigo: string;
        };
        evento: {
            nome: string;
        };
    } & {
        id: string;
        createdAt: Date;
        email: string | null;
        updatedAt: Date;
        unidadeId: string | null;
        nome: string;
        telefone: string | null;
        origem: string;
        campanha: string | null;
        estado: string;
        eventoId: string | null;
        notas: string | null;
        dataContacto: Date | null;
        dataAgendamento: Date | null;
        dataConversao: Date | null;
        motivoPerda: string | null;
    })[]>;
    pipeline(uid?: string): Promise<{
        pipeline: Record<string, number>;
        total: number;
        conversao: number;
    }>;
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
        unidade: {
            id: string;
            createdAt: Date;
            email: string | null;
            updatedAt: Date;
            nome: string;
            codigo: string;
            tipo: string;
            endereco: string | null;
            contacto: string | null;
            ativo: boolean;
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
    } & {
        id: string;
        createdAt: Date;
        email: string | null;
        updatedAt: Date;
        unidadeId: string | null;
        nome: string;
        telefone: string | null;
        origem: string;
        campanha: string | null;
        estado: string;
        eventoId: string | null;
        notas: string | null;
        dataContacto: Date | null;
        dataAgendamento: Date | null;
        dataConversao: Date | null;
        motivoPerda: string | null;
    }>;
    create(body: any): import(".prisma/client").Prisma.Prisma__LeadClient<{
        id: string;
        createdAt: Date;
        email: string | null;
        updatedAt: Date;
        unidadeId: string | null;
        nome: string;
        telefone: string | null;
        origem: string;
        campanha: string | null;
        estado: string;
        eventoId: string | null;
        notas: string | null;
        dataContacto: Date | null;
        dataAgendamento: Date | null;
        dataConversao: Date | null;
        motivoPerda: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        email: string | null;
        updatedAt: Date;
        unidadeId: string | null;
        nome: string;
        telefone: string | null;
        origem: string;
        campanha: string | null;
        estado: string;
        eventoId: string | null;
        notas: string | null;
        dataContacto: Date | null;
        dataAgendamento: Date | null;
        dataConversao: Date | null;
        motivoPerda: string | null;
    }>;
}
