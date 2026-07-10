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
exports.CertificadosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
let CertificadosService = class CertificadosService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(query = {}) {
        const where = {};
        if (query.studentId)
            where.studentId = query.studentId;
        if (query.eventoId)
            where.eventoId = query.eventoId;
        return this.prisma.certificado.findMany({
            where, orderBy: { dataEmissao: 'desc' },
            include: { student: { select: { firstName: true, lastName: true } }, fase: true, validadoPor: { select: { email: true } } },
        });
    }
    async findOne(id) {
        const c = await this.prisma.certificado.findUnique({
            where: { id }, include: { student: true, fase: true, validadoPor: true, evento: true },
        });
        if (!c)
            throw new common_1.NotFoundException('Certificado não encontrado');
        return c;
    }
    async create(data, validadoPorId) {
        const serie = `MAST-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        return this.prisma.certificado.create({
            data: { ...data, validadoPorId, numeroSerie: serie },
            include: { student: true, fase: true },
        });
    }
    findByAtleta(studentId) {
        return this.prisma.certificado.findMany({
            where: { studentId }, orderBy: { dataEmissao: 'desc' },
            include: { fase: true, evento: { select: { nome: true, data: true } } },
        });
    }
};
exports.CertificadosService = CertificadosService;
exports.CertificadosService = CertificadosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CertificadosService);
//# sourceMappingURL=certificados.service.js.map