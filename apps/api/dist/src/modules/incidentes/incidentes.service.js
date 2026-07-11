"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let IncidentesService = class IncidentesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(query = {}) {
        const where = {};
        if (query.estado)
            where.estado = query.estado;
        if (query.unidadeId)
            where.unidadeId = query.unidadeId;
        if (query.tipo)
            where.tipo = query.tipo;
        if (query.tipoOcorrencia)
            where.tipoOcorrencia = query.tipoOcorrencia;
        if (query.protocoloId)
            where.protocoloId = query.protocoloId;
        return this.prisma.incidente.findMany({
            where,
            orderBy: { data: 'desc' },
            include: {
                unidade: { select: { nome: true, codigo: true } },
                reportadoPor: { select: { email: true } },
                protocolo: { select: { nome: true, ranking: true, dimensao: true } },
            },
        });
    }
    async findOne(id) {
        const i = await this.prisma.incidente.findUnique({
            where: { id },
            include: {
                unidade: true,
                reportadoPor: { select: { email: true, role: true } },
                protocolo: true,
            },
        });
        if (!i)
            throw new common_1.NotFoundException('Incidente não encontrado');
        return i;
    }
    create(data, userId) {
        const { protocoloId, dimensoes, ...rest } = data;
        return this.prisma.incidente.create({
            data: {
                ...rest,
                reportadoPorId: userId,
                dimensoes: Array.isArray(dimensoes) ? JSON.stringify(dimensoes) : (dimensoes || '[]'),
                ...(protocoloId ? { protocoloId } : {}),
            },
        });
    }
    createRelampago(userId, unidadeId) {
        return this.prisma.incidente.create({
            data: {
                tipo: 'ACIDENTE_GRAVE',
                tipoOcorrencia: 'INCIDENTE_CONFIRMADO',
                isRelampago: true,
                descricao: 'RELÂMPAGO ZERO — Evacuação imediata acionada pelo instrutor',
                acaoImediata: 'Atletas evacuados da piscina imediatamente. Aguardar 30 min após último trovão.',
                dimensoes: JSON.stringify(['FISICA']),
                estado: 'REPORTADO',
                reportadoPorId: userId,
                ...(unidadeId && { unidadeId }),
            },
        });
    }
    async update(id, data) {
        await this.findOne(id);
        if (data.estado === 'RESOLVIDO' && !data.resolvidoEm)
            data.resolvidoEm = new Date();
        if (data.dimensoes && Array.isArray(data.dimensoes))
            data.dimensoes = JSON.stringify(data.dimensoes);
        return this.prisma.incidente.update({ where: { id }, data });
    }
    async stats() {
        const [total, abertos, graves, quaseIncidentes, confirmados] = await Promise.all([
            this.prisma.incidente.count(),
            this.prisma.incidente.count({ where: { estado: { in: ['REPORTADO', 'EM_INVESTIGACAO'] } } }),
            this.prisma.incidente.count({ where: { tipo: 'ACIDENTE_GRAVE' } }),
            this.prisma.incidente.count({ where: { tipoOcorrencia: 'QUASE_INCIDENTE' } }),
            this.prisma.incidente.count({ where: { tipoOcorrencia: 'INCIDENTE_CONFIRMADO' } }),
        ]);
        return { total, abertos, graves, quaseIncidentes, confirmados, zerado: graves === 0 };
    }
};
exports.IncidentesService = IncidentesService;
exports.IncidentesService = IncidentesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IncidentesService);
//# sourceMappingURL=incidentes.service.js.map