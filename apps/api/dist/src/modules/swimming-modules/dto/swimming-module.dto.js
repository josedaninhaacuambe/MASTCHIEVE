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
exports.UpdateProgressDto = exports.CreateSwimmingModuleDto = exports.ModuleLevel = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
var ModuleLevel;
(function (ModuleLevel) {
    ModuleLevel["BEGINNER"] = "BEGINNER";
    ModuleLevel["ELEMENTARY"] = "ELEMENTARY";
    ModuleLevel["INTERMEDIATE"] = "INTERMEDIATE";
    ModuleLevel["ADVANCED"] = "ADVANCED";
    ModuleLevel["COMPETITIVE"] = "COMPETITIVE";
})(ModuleLevel || (exports.ModuleLevel = ModuleLevel = {}));
class CreateSwimmingModuleDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, description: { required: false, type: () => String }, level: { required: true, enum: require("./swimming-module.dto").ModuleLevel }, order: { required: true, type: () => Number, minimum: 1 }, skills: { required: false, type: () => [String] } };
    }
}
exports.CreateSwimmingModuleDto = CreateSwimmingModuleDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSwimmingModuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSwimmingModuleDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ModuleLevel }),
    (0, class_validator_1.IsEnum)(ModuleLevel),
    __metadata("design:type", String)
], CreateSwimmingModuleDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSwimmingModuleDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSwimmingModuleDto.prototype, "skills", void 0);
class UpdateProgressDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => String }, notes: { required: false, type: () => String } };
    }
}
exports.UpdateProgressDto = UpdateProgressDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REVIEW'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProgressDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProgressDto.prototype, "notes", void 0);
//# sourceMappingURL=swimming-module.dto.js.map