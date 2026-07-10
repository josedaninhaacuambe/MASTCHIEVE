import { PrismaService } from '../../config/prisma/prisma.service';
export declare class ComunicacaoService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query?: any): import(".prisma/client").Prisma.PrismaPromise<({
        solicitante: {
            email: string;
        };
        aprovadoPor: {
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        link: string | null;
        updatedAt: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        descricao: string;
        observacoes: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
        titulo: string;
        prazo: Date;
        solicitanteId: string;
    })[]>;
    findOne(id: string): Promise<{
        solicitante: {
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
        aprovadoPor: {
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
        link: string | null;
        updatedAt: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        descricao: string;
        observacoes: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
        titulo: string;
        prazo: Date;
        solicitanteId: string;
    }>;
    create(data: any, solicitanteId: string): import(".prisma/client").Prisma.Prisma__PedidoComunicacaoClient<{
        id: string;
        createdAt: Date;
        link: string | null;
        updatedAt: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        descricao: string;
        observacoes: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
        titulo: string;
        prazo: Date;
        solicitanteId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        updatedAt: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        descricao: string;
        observacoes: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
        titulo: string;
        prazo: Date;
        solicitanteId: string;
    }>;
    aprovar(id: string, aprovadoPorId: string): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        updatedAt: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        descricao: string;
        observacoes: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
        titulo: string;
        prazo: Date;
        solicitanteId: string;
    }>;
    publicar(id: string, link?: string): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        updatedAt: Date;
        unidadeId: string | null;
        tipo: string;
        estado: string;
        descricao: string;
        observacoes: string | null;
        aprovadoPorId: string | null;
        aprovadoEm: Date | null;
        titulo: string;
        prazo: Date;
        solicitanteId: string;
    }>;
}
