import { UnidadesService } from './unidades.service';
export declare class UnidadesController {
    private readonly svc;
    constructor(svc: UnidadesService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<{
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
    }[]>;
    findOne(id: string): Promise<{
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
    }>;
    stats(id: string): Promise<{
        turmas: number;
        estudantes: number;
        leads: number;
        incidentes: number;
    }>;
    create(body: any): import(".prisma/client").Prisma.Prisma__UnidadeClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: any): Promise<{
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
    }>;
}
