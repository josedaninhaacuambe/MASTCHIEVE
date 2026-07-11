import { PrismaService } from '../../config/prisma/prisma.service';
export declare class SegurancaService {
    private prisma;
    constructor(prisma: PrismaService);
    dashboardSemanal(unidadeId?: string): Promise<{
        periodo: {
            inicio: Date;
            fim: Date;
        };
        incidentes: {
            total: number;
            lista: ({
                protocolo: {
                    nome: string;
                    ranking: number;
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
            })[];
        };
        quaseIncidentes: number;
        checklists: {
            total: number;
            completadas: number;
            porProtocolo: {
                completadas: number;
                total: number;
                id: string;
                nome: string;
                ranking: number;
                dimensao: string;
            }[];
        };
    }>;
    dashboardMensal(unidadeId?: string): Promise<{
        periodo: {
            inicio: Date;
            fim: Date;
        };
        totais: {
            incidentes: number;
            quaseIncidentes: number;
            graves: number;
        };
        metaZeroGraves: boolean;
        porDimensao: {
            dimensao: string;
            total: number;
            incidentes: number;
            quaseIncidentes: number;
        }[];
        porProtocolo: {
            protocolo: any;
            total: number;
            quaseIncidentes: number;
        }[];
        tendencia: any[];
    }>;
    reincidencias(unidadeId?: string): Promise<{
        periodo: {
            inicio: Date;
            fim: Date;
        };
        alertas: {
            tipo: string;
            instrutorEmail: any;
            protocoloNome: any;
            contagem: number;
            periodo: string;
            escalado: boolean;
            incidentes: {
                id: any;
                data: any;
                tipo: any;
                tipoOcorrencia: any;
            }[];
        }[];
        totalReincidencias: number;
        semAlertas: boolean;
    }>;
    private agruparPorDimensao;
    private agruparPorProtocolo;
    private tendencia3Meses;
}
