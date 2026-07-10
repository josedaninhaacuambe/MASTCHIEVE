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
exports.EventosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let EventosService = class EventosService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(query = {}) {
        const where = {};
        if (query.tipo)
            where.tipo = query.tipo;
        if (query.estado)
            where.estado = query.estado;
        if (query.unidadeId)
            where.unidadeId = query.unidadeId;
        return this.prisma.evento.findMany({
            where, orderBy: { data: 'desc' },
            include: { unidade: { select: { nome: true, codigo: true } }, _count: { select: { certificados: true, leads: true } } },
        });
    }
    async findOne(id) {
        const e = await this.prisma.evento.findUnique({
            where: { id }, include: { unidade: true, certificados: { include: { student: true, fase: true } }, leads: true },
        });
        if (!e)
            throw new common_1.NotFoundException('Evento não encontrado');
        return e;
    }
    create(data) { return this.prisma.evento.create({ data }); }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.evento.update({ where: { id }, data });
    }
};
exports.EventosService = EventosService;
exports.EventosService = EventosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventosService);
//# sourceMappingURL=eventos.service.js.map