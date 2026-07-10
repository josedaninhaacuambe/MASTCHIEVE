import { EventosService } from './eventos.service';
export declare class EventosController {
    private readonly svc;
    constructor(svc: EventosService);
    findAll(q: any): import(".prisma/client").Prisma.PrismaPromise<({
        unidade: {
            nome: string;
            codigo: string;
        };
        _count: {
            certificados: number;
            leads: number;
        };
    } & {
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
        certificados: ({
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
        })[];
        leads: {
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
        }[];
    } & {
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
    }>;
    create(body: any): import(".prisma/client").Prisma.Prisma__EventoClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: any): Promise<{
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
    }>;
}
