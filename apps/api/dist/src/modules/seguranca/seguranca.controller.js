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
exports.SegurancaController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const seguranca_service_1 = require("./seguranca.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let SegurancaController = class SegurancaController {
    constructor(svc) {
        this.svc = svc;
    }
    semanal(unidadeId) { return this.svc.dashboardSemanal(unidadeId); }
    mensal(unidadeId) { return this.svc.dashboardMensal(unidadeId); }
    reincidencias(unidadeId) { return this.svc.reincidencias(unidadeId); }
};
exports.SegurancaController = SegurancaController;
__decorate([
    (0, common_1.Get)('semanal'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INSTRUCTOR', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Dashboard semanal de segurança' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('unidadeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SegurancaController.prototype, "semanal", null);
__decorate([
    (0, common_1.Get)('mensal'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Dashboard mensal de segurança com KPIs por dimensão' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('unidadeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SegurancaController.prototype, "mensal", null);
__decorate([
    (0, common_1.Get)('reincidencias'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Alertas de reincidência automática (3+ ocorrências/30 dias)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)('unidadeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SegurancaController.prototype, "reincidencias", null);
exports.SegurancaController = SegurancaController = __decorate([
    (0, swagger_1.ApiTags)('seguranca'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('seguranca'),
    __metadata("design:paramtypes", [seguranca_service_1.SegurancaService])
], SegurancaController);
//# sourceMappingURL=seguranca.controller.js.map