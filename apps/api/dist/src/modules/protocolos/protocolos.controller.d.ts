import { ProtocolosService } from './protocolos.service';
export declare class ProtocolosController {
    private svc;
    constructor(svc: ProtocolosService);
    findAll(): Promise<{
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
    }[]>;
    stats(): Promise<{
        incidentesCount: number;
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
    }[]>;
    findOne(id: string): Promise<{
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
    }>;
    update(id: string, body: any): Promise<{
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
    }>;
    findChecklists(q: any): Promise<({
        protocolo: {
            nome: string;
            ranking: number;
            dimensao: string;
        };
        instrutor: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        data: Date;
        sessionId: string | null;
        items: string;
        protocoloId: string;
        observacoes: string | null;
        instrutorId: string;
        completado: boolean;
    })[]>;
    createChecklist(body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        data: Date;
        sessionId: string | null;
        items: string;
        protocoloId: string;
        observacoes: string | null;
        instrutorId: string;
        completado: boolean;
    }>;
    updateChecklist(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        data: Date;
        sessionId: string | null;
        items: string;
        protocoloId: string;
        observacoes: string | null;
        instrutorId: string;
        completado: boolean;
    }>;
}
