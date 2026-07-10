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
exports.SwimmingModulesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../config/prisma/prisma.service");
function parseJson(raw) {
    try {
        return JSON.parse(raw);
    }
    catch {
        return [];
    }
}
function detectYoutubeId(url) {
    const patterns = [
        /youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})/,
        /youtu\.be\/([A-Za-z0-9_-]{11})/,
        /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
        /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m)
            return m[1];
    }
    return null;
}
let SwimmingModulesService = class SwimmingModulesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = { isActive: true };
        if (query.level)
            where.level = query.level;
        const modules = await this.prisma.swimmingModule.findMany({
            where,
            orderBy: { order: 'asc' },
            include: {
                progress: { select: { status: true } },
            },
        });
        return modules.map((m) => ({
            ...m,
            skills: parseJson(m.skills),
            videos: parseJson(m.videos),
            progressStats: {
                total: m.progress.length,
                completed: m.progress.filter((p) => p.status === 'COMPLETED').length,
                inProgress: m.progress.filter((p) => p.status === 'IN_PROGRESS').length,
            },
            progress: undefined,
        }));
    }
    async findOne(id) {
        const mod = await this.prisma.swimmingModule.findUnique({
            where: { id },
            include: {
                progress: {
                    include: {
                        student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                    },
                    orderBy: { updatedAt: 'desc' },
                },
            },
        });
        if (!mod)
            throw new common_1.NotFoundException('Módulo não encontrado');
        return {
            ...mod,
            skills: parseJson(mod.skills),
            videos: parseJson(mod.videos),
        };
    }
    async create(dto) {
        return this.prisma.swimmingModule.create({
            data: {
                ...dto,
                skills: JSON.stringify(dto.skills ?? []),
            },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        const data = { ...dto };
        if (dto.skills)
            data.skills = JSON.stringify(dto.skills);
        return this.prisma.swimmingModule.update({ where: { id }, data });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.swimmingModule.update({ where: { id }, data: { isActive: false } });
    }
    async addVideo(moduleId, dto) {
        const mod = await this.prisma.swimmingModule.findUnique({ where: { id: moduleId } });
        if (!mod)
            throw new common_1.NotFoundException('Módulo não encontrado');
        const youtubeId = detectYoutubeId(dto.url);
        const videos = parseJson(mod.videos);
        const video = {
            id: (0, crypto_1.randomUUID)(),
            title: dto.title,
            url: dto.url,
            description: dto.description ?? null,
            source: youtubeId ? 'youtube' : 'external',
            youtubeId: youtubeId ?? null,
            addedAt: new Date().toISOString(),
        };
        videos.push(video);
        await this.prisma.swimmingModule.update({
            where: { id: moduleId },
            data: { videos: JSON.stringify(videos) },
        });
        return video;
    }
    async removeVideo(moduleId, videoId) {
        const mod = await this.prisma.swimmingModule.findUnique({ where: { id: moduleId } });
        if (!mod)
            throw new common_1.NotFoundException('Módulo não encontrado');
        const videos = parseJson(mod.videos).filter((v) => v.id !== videoId);
        await this.prisma.swimmingModule.update({
            where: { id: moduleId },
            data: { videos: JSON.stringify(videos) },
        });
        return { deleted: true };
    }
    async getStudentProgress(studentId) {
        const [modules, progress] = await Promise.all([
            this.prisma.swimmingModule.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
            this.prisma.progress.findMany({ where: { studentId } }),
        ]);
        const progressMap = new Map(progress.map((p) => [p.moduleId, p]));
        return modules.map((m) => {
            const p = progressMap.get(m.id);
            return {
                ...m,
                skills: parseJson(m.skills),
                videos: parseJson(m.videos),
                progress: p ?? { status: 'NOT_STARTED', startedAt: null, completedAt: null, notes: null },
            };
        });
    }
    async updateProgress(studentId, moduleId, dto) {
        const mod = await this.prisma.swimmingModule.findUnique({ where: { id: moduleId } });
        if (!mod)
            throw new common_1.NotFoundException('Módulo não encontrado');
        const completedAt = dto.status === 'COMPLETED' ? new Date() : undefined;
        const startedAt = dto.status === 'NOT_STARTED' ? undefined : new Date();
        return this.prisma.progress.upsert({
            where: { studentId_moduleId: { studentId, moduleId } },
            create: {
                studentId,
                moduleId,
                status: dto.status,
                notes: dto.notes,
                ...(dto.status !== 'NOT_STARTED' && { startedAt }),
                ...(completedAt && { completedAt }),
            },
            update: {
                status: dto.status,
                notes: dto.notes,
                ...(dto.status !== 'NOT_STARTED' && { startedAt }),
                ...(completedAt && { completedAt }),
            },
        });
    }
};
exports.SwimmingModulesService = SwimmingModulesService;
exports.SwimmingModulesService = SwimmingModulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SwimmingModulesService);
//# sourceMappingURL=swimming-modules.service.js.map