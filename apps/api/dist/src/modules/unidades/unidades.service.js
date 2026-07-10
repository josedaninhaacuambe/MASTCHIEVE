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
exports.UnidadesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let UnidadesService = class UnidadesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.unidade.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
    }
    async findOne(id) {
        const u = await this.prisma.unidade.findUnique({ where: { id } });
        if (!u)
            throw new common_1.NotFoundException('Unidade não encontrada');
        return u;
    }
    create(data) {
        return this.prisma.unidade.create({ data });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.unidade.update({ where: { id }, data });
    }
    async stats(id) {
        const [turmas, estudantes, leads, incidentes] = await Promise.all([
            this.prisma.class.count({ where: { unidadeId: id } }),
            this.prisma.student.count({ where: { unidadeId: id, isActive: true } }),
            this.prisma.lead.count({ where: { unidadeId: id } }),
            this.prisma.incidente.count({ where: { unidadeId: id } }),
        ]);
        return { turmas, estudantes, leads, incidentes };
    }
};
exports.UnidadesService = UnidadesService;
exports.UnidadesService = UnidadesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UnidadesService);
//# sourceMappingURL=unidades.service.js.map