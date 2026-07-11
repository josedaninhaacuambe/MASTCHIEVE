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
exports.ProtocolosController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const protocolos_service_1 = require("./protocolos.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let ProtocolosController = class ProtocolosController {
    constructor(svc) {
        this.svc = svc;
    }
    findAll() { return this.svc.findAll(); }
    stats() { return this.svc.stats(); }
    findOne(id) { return this.svc.findOne(id); }
    update(id, body) { return this.svc.update(id, body); }
    findChecklists(q) { return this.svc.findChecklists(q); }
    createChecklist(body, req) {
        return this.svc.createChecklist(body, req.user.userId);
    }
    updateChecklist(id, body) {
        return this.svc.updateChecklist(id, body);
    }
};
exports.ProtocolosController = ProtocolosController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'INSTRUCTOR', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar protocolos de segurança' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProtocolosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)('ADMIN', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Protocolos com contagem de incidentes' }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProtocolosController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INSTRUCTOR', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Detalhes do protocolo' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProtocolosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Editar protocolo (Admin)' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProtocolosController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('checklists/list'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INSTRUCTOR', 'ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar checklists preenchidas' }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProtocolosController.prototype, "findChecklists", null);
__decorate([
    (0, common_1.Post)('checklists'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INSTRUCTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Preencher checklist de protocolo' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProtocolosController.prototype, "createChecklist", null);
__decorate([
    (0, common_1.Put)('checklists/:id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'INSTRUCTOR'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar checklist' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProtocolosController.prototype, "updateChecklist", null);
exports.ProtocolosController = ProtocolosController = __decorate([
    (0, swagger_1.ApiTags)('protocolos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('protocolos'),
    __metadata("design:paramtypes", [protocolos_service_1.ProtocolosService])
], ProtocolosController);
//# sourceMappingURL=protocolos.controller.js.map