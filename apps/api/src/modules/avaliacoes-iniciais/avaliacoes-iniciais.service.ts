import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class AvaliacoesIniciaisService {
  constructor(private prisma: PrismaService) {}

  findAll(query: any = {}) {
    const where: any = {};
    if (query.instrutorId) where.instrutorId = query.instrutorId;
    return this.prisma.avaliacaoInicial.findMany({
      where, orderBy: { data: 'desc' },
      include: { student: { select: { firstName: true, lastName: true } }, instrutor: { select: { firstName: true, lastName: true } }, faseRecomendada: true },
    });
  }

  async findOne(id: string) {
    const a = await this.prisma.avaliacaoInicial.findUnique({
      where: { id }, include: { student: true, instrutor: true, faseRecomendada: true },
    });
    if (!a) throw new NotFoundException('Avaliação não encontrada');
    return a;
  }

  findByStudent(studentId: string) {
    return this.prisma.avaliacaoInicial.findUnique({
      where: { studentId },
      include: { faseRecomendada: true, instrutor: { select: { firstName: true, lastName: true } } },
    });
  }

  async create(data: any, userId: string) {
    const instructor = await this.prisma.instructor.findUnique({ where: { userId } });
    if (!instructor) throw new BadRequestException('Utilizador não tem perfil de instrutor');
    return this.prisma.avaliacaoInicial.create({ data: { ...data, instrutorId: instructor.id } });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.avaliacaoInicial.update({ where: { id }, data });
  }

  async aprovar(id: string, aprovadoPorId: string) {
    const avaliacao = await this.prisma.avaliacaoInicial.update({
      where: { id },
      data: { aprovadoPorId, aprovadoEm: new Date() },
      include: { faseRecomendada: true },
    });

    if (avaliacao.faseRecomendadaId && avaliacao.faseRecomendada) {
      const criterios: { nome: string; obrigatoria: boolean }[] = JSON.parse(avaliacao.faseRecomendada.criterios);
      const objectives = criterios.filter((c) => c.obrigatoria).map((c) => c.nome);
      const exercises = criterios.map((c) => c.nome);

      await this.prisma.trainingPlan.create({
        data: {
          studentId: avaliacao.studentId,
          instructorId: avaliacao.instrutorId,
          title: 'Road Map Inicial',
          description: `Plano gerado automaticamente após aprovação da avaliação de diagnóstico — módulo recomendado: ${avaliacao.faseRecomendada.nome}`,
          objectives: JSON.stringify(objectives),
          exercises: JSON.stringify(exercises),
          aiGenerated: false,
          validFrom: new Date(),
        },
      });
    }

    return avaliacao;
  }
}
