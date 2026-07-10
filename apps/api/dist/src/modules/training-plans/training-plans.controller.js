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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingPlansController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../../config/prisma/prisma.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let TrainingPlansController = class TrainingPlansController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(100, parseInt(query.limit) || 20);
        const where = {};
        if (query.isActive !== undefined)
            where.isActive = query.isActive === 'true';
        if (query.aiGenerated !== undefined)
            where.aiGenerated = query.aiGenerated === 'true';
        if (query.studentId)
            where.studentId = query.studentId;
        if (query.search) {
            where.OR = [
                { title: { contains: query.search } },
                { student: { firstName: { contains: query.search } } },
                { student: { lastName: { contains: query.search } } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.trainingPlan.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: { select: { id: true, firstName: true, lastName: true } },
                    instructor: { select: { firstName: true, lastName: true } },
                },
            }),
            this.prisma.trainingPlan.count({ where }),
        ]);
        return {
            data: data.map((p) => ({
                ...p,
                objectives: (() => { try {
                    return JSON.parse(p.objectives);
                }
                catch {
                    return p.objectives;
                } })(),
                exercises: (() => { try {
                    return JSON.parse(p.exercises);
                }
                catch {
                    return p.exercises;
                } })(),
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const plan = await this.prisma.trainingPlan.findUnique({
            where: { id },
            include: {
                student: { select: { id: true, firstName: true, lastName: true } },
                instructor: { select: { firstName: true, lastName: true } },
            },
        });
        if (!plan)
            throw new Error('Plano não encontrado');
        return {
            ...plan,
            objectives: (() => { try {
                return JSON.parse(plan.objectives);
            }
            catch {
                return plan.objectives;
            } })(),
            exercises: (() => { try {
                return JSON.parse(plan.exercises);
            }
            catch {
                return plan.exercises;
            } })(),
        };
    }
    async toggle(id) {
        const plan = await this.prisma.trainingPlan.findUnique({ where: { id }, select: { isActive: true } });
        if (!plan)
            throw new Error('Plano não encontrado');
        return this.prisma.trainingPlan.update({ where: { id }, data: { isActive: !plan.isActive } });
    }
};
exports.TrainingPlansController = TrainingPlansController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'INSTRUCTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar planos de treino' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TrainingPlansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INSTRUCTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalhe do plano' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrainingPlansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INSTRUCTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Activar/desactivar plano' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrainingPlansController.prototype, "toggle", null);
exports.TrainingPlansController = TrainingPlansController = __decorate([
    (0, swagger_1.ApiTags)('training-plans'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('training-plans'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrainingPlansController);
//# sourceMappingURL=training-plans.controller.js.map