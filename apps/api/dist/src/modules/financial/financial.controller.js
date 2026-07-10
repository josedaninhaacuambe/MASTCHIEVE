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
exports.FinancialController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const financial_service_1 = require("./financial.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let FinancialController = class FinancialController {
    constructor(service) {
        this.service = service;
    }
    getMyPayments(userId, q) {
        return this.service.getMyPayments(userId, q);
    }
    getPayments(query) { return this.service.getPayments(query); }
    createPayment(dto) { return this.service.createPayment(dto); }
    markAsPaid(id, method) {
        return this.service.markAsPaid(id, method);
    }
    generateMonthlyFees(body) {
        return this.service.generateMonthlyFees(body.month, body.year, body.amount);
    }
    getSummary(year) {
        return this.service.getFinancialSummary(year || new Date().getFullYear());
    }
    getStudentBalance(studentId) {
        return this.service.getStudentBalance(studentId);
    }
    sendReminders() {
        return this.service.sendReminders();
    }
    async exportPdf(year, res) {
        const y = parseInt(year) || new Date().getFullYear();
        const buffer = await this.service.exportPdf(y);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="mastchieve-financeiro-${y}.pdf"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
};
exports.FinancialController = FinancialController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)('STUDENT'),
    (0, swagger_1.ApiOperation)({ summary: 'Pagamentos do atleta autenticado' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getMyPayments", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar pagamentos' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Post)('payments'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar pagamento' }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Patch)('payments/:id/pay'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar pagamento como pago' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('method')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "markAsPaid", null);
__decorate([
    (0, common_1.Post)('monthly-fees/generate'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar mensalidades para todos os atletas ativos' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "generateMonthlyFees", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Resumo financeiro anual' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('students/:studentId/balance'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INSTRUCTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Saldo do atleta' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "getStudentBalance", null);
__decorate([
    (0, common_1.Post)('send-reminders'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar lembretes de pagamento por email' }),
    openapi.ApiResponse({ status: 201 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FinancialController.prototype, "sendReminders", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Exportar relatório financeiro em PDF' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinancialController.prototype, "exportPdf", null);
exports.FinancialController = FinancialController = __decorate([
    (0, swagger_1.ApiTags)('financial'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('financial'),
    __metadata("design:paramtypes", [financial_service_1.FinancialService])
], FinancialController);
//# sourceMappingURL=financial.controller.js.map