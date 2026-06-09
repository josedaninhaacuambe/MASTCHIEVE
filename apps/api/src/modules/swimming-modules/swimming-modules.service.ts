import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../config/prisma/prisma.service';
import { CreateSwimmingModuleDto, UpdateProgressDto } from './dto/swimming-module.dto';

function parseJson(raw: string): any[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function detectYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

@Injectable()
export class SwimmingModulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const where: any = { isActive: true };
    if (query.level) where.level = query.level;

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

  async findOne(id: string) {
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
    if (!mod) throw new NotFoundException('Módulo não encontrado');
    return {
      ...mod,
      skills: parseJson(mod.skills),
      videos: parseJson(mod.videos),
    };
  }

  async create(dto: CreateSwimmingModuleDto) {
    return this.prisma.swimmingModule.create({
      data: {
        ...dto,
        skills: JSON.stringify(dto.skills ?? []),
      },
    });
  }

  async update(id: string, dto: Partial<CreateSwimmingModuleDto>) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.skills) data.skills = JSON.stringify(dto.skills);
    return this.prisma.swimmingModule.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.swimmingModule.update({ where: { id }, data: { isActive: false } });
  }

  async addVideo(moduleId: string, dto: { title: string; url: string; description?: string }) {
    const mod = await this.prisma.swimmingModule.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Módulo não encontrado');

    const youtubeId = detectYoutubeId(dto.url);
    const videos = parseJson(mod.videos);
    const video = {
      id: randomUUID(),
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

  async removeVideo(moduleId: string, videoId: string) {
    const mod = await this.prisma.swimmingModule.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Módulo não encontrado');

    const videos = parseJson(mod.videos).filter((v: any) => v.id !== videoId);
    await this.prisma.swimmingModule.update({
      where: { id: moduleId },
      data: { videos: JSON.stringify(videos) },
    });
    return { deleted: true };
  }

  async getStudentProgress(studentId: string) {
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

  async updateProgress(studentId: string, moduleId: string, dto: UpdateProgressDto) {
    const mod = await this.prisma.swimmingModule.findUnique({ where: { id: moduleId } });
    if (!mod) throw new NotFoundException('Módulo não encontrado');

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
}
