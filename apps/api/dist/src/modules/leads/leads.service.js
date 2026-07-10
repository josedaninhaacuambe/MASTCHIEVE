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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let LeadsService = class LeadsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(query = {}) {
        const where = {};
        if (query.estado)
            where.estado = query.estado;
        if (query.unidadeId)
            where.unidadeId = query.unidadeId;
        if (query.origem)
            where.origem = query.origem;
        return this.prisma.lead.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: { unidade: { select: { nome: true, codigo: true } }, evento: { select: { nome: true } } },
        });
    }
    async findOne(id) {
        const lead = await this.prisma.lead.findUnique({
            where: { id },
            include: { unidade: true, evento: true, student: true },
        });
        if (!lead)
            throw new common_1.NotFoundException('Lead não encontrado');
        return lead;
    }
    create(data) {
        return this.prisma.lead.create({ data });
    }
    async update(id, data) {
        await this.findOne(id);
        if (data.estado === 'CONVERTIDO' && !data.dataConversao)
            data.dataConversao = new Date();
        return this.prisma.lead.update({ where: { id }, data });
    }
    async pipeline(unidadeId) {
        const where = unidadeId ? { unidadeId } : {};
        const estados = ['NOVO', 'CONTACTADO', 'AGENDADO', 'CONVERTIDO', 'PERDIDO'];
        const counts = await this.prisma.lead.groupBy({
            by: ['estado'], where, _count: true,
        });
        const result = {};
        for (const e of estados)
            result[e] = 0;
        for (const c of counts)
            result[c.estado] = c._count;
        const total = Object.values(result).reduce((a, b) => a + b, 0);
        const conversao = total > 0 ? Math.round((result['CONVERTIDO'] / total) * 100) : 0;
        return { pipeline: result, total, conversao };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map