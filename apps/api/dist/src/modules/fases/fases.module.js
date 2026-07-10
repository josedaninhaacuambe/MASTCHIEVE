"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FasesModule = void 0;
const common_1 = require("@nestjs/common");
const fases_controller_1 = require("./fases.controller");
const fases_service_1 = require("./fases.service");
let FasesModule = class FasesModule {
};
exports.FasesModule = FasesModule;
exports.FasesModule = FasesModule = __decorate([
    (0, common_1.Module)({ controllers: [fases_controller_1.FasesController], providers: [fases_service_1.FasesService], exports: [fases_service_1.FasesService] })
], FasesModule);
//# sourceMappingURL=fases.module.js.map