import { PrismaService } from '../../config/prisma/prisma.service';
export declare class CompeticoesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query?: any): import(".prisma/client").Prisma.PrismaPromise<({
        unidade: {
            nome: string;
        };
        _count: {
            atletas: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Date;
        unidadeId: string | null;
        nome: string;
        estado: string;
        descricao: string | null;
        local: string;
        planoCompetitivo: string | null;
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
        atletas: ({
            student: {
                firstName: string;
                lastName: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            studentId: string;
            notas: string | null;
            competicaoId: string;
            prova: string | null;
            resultado: string | null;
            posicao: number | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Date;
        unidadeId: string | null;
        nome: string;
        estado: string;
        descricao: string | null;
        local: string;
        planoCompetitivo: string | null;
    }>;
    create(data: any): import(".prisma/client").Prisma.Prisma__CompeticaoClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Date;
        unidadeId: string | null;
        nome: string;
        estado: string;
        descricao: string | null;
        local: string;
        planoCompetitivo: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: Date;
        unidadeId: string | null;
        nome: string;
        estado: string;
        descricao: string | null;
        local: string;
        planoCompetitivo: string | null;
    }>;
    addAtleta(id: string, studentId: string, extra?: any): Promise<{
        id: string;
        studentId: string;
        notas: string | null;
        competicaoId: string;
        prova: string | null;
        resultado: string | null;
        posicao: number | null;
    }>;
    removeAtleta(id: string, studentId: string): Promise<{
        id: string;
        studentId: string;
        notas: string | null;
        competicaoId: string;
        prova: string | null;
        resultado: string | null;
        posicao: number | null;
    }>;
}
