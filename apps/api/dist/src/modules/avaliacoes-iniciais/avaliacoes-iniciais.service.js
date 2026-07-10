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
exports.AvaliacoesIniciaisService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let AvaliacoesIniciaisService = class AvaliacoesIniciaisService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(query = {}) {
        const where = {};
        if (query.instrutorId)
            where.instrutorId = query.instrutorId;
        return this.prisma.avaliacaoInicial.findMany({
            where, orderBy: { data: 'desc' },
            include: { student: { select: { firstName: true, lastName: true } }, instrutor: { select: { firstName: true, lastName: true } }, faseRecomendada: true },
        });
    }
    async findOne(id) {
        const a = await this.prisma.avaliacaoInicial.findUnique({
            where: { id }, include: { student: true, instrutor: true, faseRecomendada: true },
        });
        if (!a)
            throw new common_1.NotFoundException('Avaliação não encontrada');
        return a;
    }
    findByStudent(studentId) {
        return this.prisma.avaliacaoInicial.findUnique({
            where: { studentId },
            include: { faseRecomendada: true, instrutor: { select: { firstName: true, lastName: true } } },
        });
    }
    create(data, instrutorId) {
        return this.prisma.avaliacaoInicial.create({ data: { ...data, instrutorId } });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.avaliacaoInicial.update({ where: { id }, data });
    }
    async aprovar(id, aprovadoPorId) {
        return this.prisma.avaliacaoInicial.update({
            where: { id }, data: { aprovadoPorId, aprovadoEm: new Date() },
        });
    }
};
exports.AvaliacoesIniciaisService = AvaliacoesIniciaisService;
exports.AvaliacoesIniciaisService = AvaliacoesIniciaisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AvaliacoesIniciaisService);
//# sourceMappingURL=avaliacoes-iniciais.service.js.map