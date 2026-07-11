import { PrismaService } from '../../config/prisma/prisma.service';
export declare class IncidentesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query?: any): import(".prisma/client").Prisma.PrismaPromise<({
        unidade: {
            nome: string;
            codigo: string;
        };
        protocolo: {
            nome: string;
            ranking: number;
            dimensao: string;
        };
        reportadoPor: {
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        tipoOcorrencia: string;
        dimensoes: string;
        protocoloId: string | null;
        isRelampago: boolean;
        escalado: boolean;
        descricao: string;
        envolvidos: string;
        acaoImediata: string;
        relatorio: string | null;
        acoesPreventivas: string | null;
        reportadoPorId: string;
        resolvidoEm: Date | null;
    })[]>;
    findOne(id: string): Promise<{
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
        protocolo: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            nome: string;
            isRelampago: boolean;
            ranking: number;
            dimensao: string;
            prioridade: string;
            justificacao: string;
            objetivo: string;
            momentoAplicacao: string;
            responsavel: string;
            procedimento: string;
            checklistItems: string;
            sinaisAlerta: string;
            acaoFalha: string;
            isAtivo: boolean;
        };
        reportadoPor: {
            email: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        tipoOcorrencia: string;
        dimensoes: string;
        protocoloId: string | null;
        isRelampago: boolean;
        escalado: boolean;
        descricao: string;
        envolvidos: string;
        acaoImediata: string;
        relatorio: string | null;
        acoesPreventivas: string | null;
        reportadoPorId: string;
        resolvidoEm: Date | null;
    }>;
    create(data: any, userId: string): import(".prisma/client").Prisma.Prisma__IncidenteClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        tipoOcorrencia: string;
        dimensoes: string;
        protocoloId: string | null;
        isRelampago: boolean;
        escalado: boolean;
        descricao: string;
        envolvidos: string;
        acaoImediata: string;
        relatorio: string | null;
        acoesPreventivas: string | null;
        reportadoPorId: string;
        resolvidoEm: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    createRelampago(userId: string, unidadeId?: string): import(".prisma/client").Prisma.Prisma__IncidenteClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        tipoOcorrencia: string;
        dimensoes: string;
        protocoloId: string | null;
        isRelampago: boolean;
        escalado: boolean;
        descricao: string;
        envolvidos: string;
        acaoImediata: string;
        relatorio: string | null;
        acoesPreventivas: string | null;
        reportadoPorId: string;
        resolvidoEm: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        tipoOcorrencia: string;
        dimensoes: string;
        protocoloId: string | null;
        isRelampago: boolean;
        escalado: boolean;
        descricao: string;
        envolvidos: string;
        acaoImediata: string;
        relatorio: string | null;
        acoesPreventivas: string | null;
        reportadoPorId: string;
        resolvidoEm: Date | null;
    }>;
    stats(): Promise<{
        total: number;
        abertos: number;
        graves: number;
        quaseIncidentes: number;
        confirmados: number;
        zerado: boolean;
    }>;
}
