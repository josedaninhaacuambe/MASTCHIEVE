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
exports.ComunicacaoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let ComunicacaoService = class ComunicacaoService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(query = {}) {
        const where = {};
        if (query.estado)
            where.estado = query.estado;
        if (query.tipo)
            where.tipo = query.tipo;
        return this.prisma.pedidoComunicacao.findMany({
            where, orderBy: { createdAt: 'desc' },
            include: { solicitante: { select: { email: true } }, aprovadoPor: { select: { email: true } } },
        });
    }
    async findOne(id) {
        const p = await this.prisma.pedidoComunicacao.findUnique({ where: { id }, include: { solicitante: true, aprovadoPor: true } });
        if (!p)
            throw new common_1.NotFoundException('Pedido não encontrado');
        return p;
    }
    create(data, solicitanteId) {
        return this.prisma.pedidoComunicacao.create({ data: { ...data, solicitanteId } });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.pedidoComunicacao.update({ where: { id }, data });
    }
    async aprovar(id, aprovadoPorId) {
        return this.prisma.pedidoComunicacao.update({
            where: { id }, data: { estado: 'APROVADO', aprovadoPorId, aprovadoEm: new Date() },
        });
    }
    async publicar(id, link) {
        return this.prisma.pedidoComunicacao.update({
            where: { id }, data: { estado: 'PUBLICADO', link },
        });
    }
};
exports.ComunicacaoService = ComunicacaoService;
exports.ComunicacaoService = ComunicacaoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComunicacaoService);
//# sourceMappingURL=comunicacao.service.js.map