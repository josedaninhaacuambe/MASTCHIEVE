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
exports.CreateSessionDto = exports.CreateClassDto = exports.ClassLevel = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
var ClassLevel;
(function (ClassLevel) {
    ClassLevel["BEGINNER"] = "BEGINNER";
    ClassLevel["ELEMENTARY"] = "ELEMENTARY";
    ClassLevel["INTERMEDIATE"] = "INTERMEDIATE";
    ClassLevel["ADVANCED"] = "ADVANCED";
    ClassLevel["COMPETITIVE"] = "COMPETITIVE";
})(ClassLevel || (exports.ClassLevel = ClassLevel = {}));
class CreateClassDto {
    constructor() {
        this.level = ClassLevel.BEGINNER;
        this.maxStudents = 12;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, level: { required: true, default: ClassLevel.BEGINNER, enum: require("./create-class.dto").ClassLevel }, maxStudents: { required: true, type: () => Number, default: 12, minimum: 1, maximum: 100 }, description: { required: false, type: () => String }, poolLane: { required: false, type: () => String }, instructorId: { required: true, type: () => String } };
    }
}
exports.CreateClassDto = CreateClassDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateClassDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ClassLevel, default: ClassLevel.BEGINNER }),
    (0, class_validator_1.IsEnum)(ClassLevel),
    __metadata("design:type", String)
], CreateClassDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ default: 12 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateClassDto.prototype, "maxStudents", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClassDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClassDto.prototype, "poolLane", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateClassDto.prototype, "instructorId", void 0);
class CreateSessionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { sessionDate: { required: true, type: () => String }, startTime: { required: false, type: () => String }, endTime: { required: false, type: () => String }, topic: { required: false, type: () => String } };
    }
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "sessionDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "topic", void 0);
//# sourceMappingURL=create-class.dto.js.map