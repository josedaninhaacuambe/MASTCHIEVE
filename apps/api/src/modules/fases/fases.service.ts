import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

const FASES_DEFAULT = [
  { nivel: 'AMA', ordem: 1, nome: 'Estrela-do-Mar', animal: 'estrela-do-mar', certificacao: 'BRONZE', descricao: 'Adaptação básica ao meio aquático', criterios: JSON.stringify(['Flutuação independente','Submersão voluntária','Deslocamento básico','Respiração controlada']), assiduidade: 80 },
  { nivel: 'AMA', ordem: 2, nome: 'Cavalo-Marinho', animal: 'cavalo-marinho', certificacao: 'BRONZE', descricao: 'Confiança e autonomia na água', criterios: JSON.stringify(['Propulsão autónoma','Controlo respiratório','Introdução ao crol','Equilíbrio aquático']), assiduidade: 80 },
  { nivel: 'AMA', ordem: 3, nome: 'Polvo', animal: 'polvo', certificacao: 'BRONZE', descricao: 'Domínio completo do nível inicial', criterios: JSON.stringify(['Crol 15m','Costas básico','Viragem simples','Saída da piscina autonomamente']), assiduidade: 80 },
  { nivel: 'INTERMEDIARIO', ordem: 4, nome: 'Tartaruga', animal: 'tartaruga', certificacao: 'PRATA', descricao: 'Desenvolvimento técnico dos estilos', criterios: JSON.stringify(['Crol técnico 25m','Costas coordenado','Introdução ao bruços','Viragem rolamento']), assiduidade: 85 },
  { nivel: 'INTERMEDIARIO', ordem: 5, nome: 'Dugongo', animal: 'dugongo', certificacao: 'PRATA', descricao: 'Consolidação dos 4 estilos', criterios: JSON.stringify(['4 estilos completos','Resistência 100m','Viragens técnicas','Saída de bloco']), assiduidade: 85 },
  { nivel: 'INTERMEDIARIO', ordem: 6, nome: 'Crocodilo', animal: 'crocodilo', certificacao: 'PRATA', descricao: 'Eficiência e ritmo', criterios: JSON.stringify(['Pacing consistente','Mariposa básico','Viragem mariposa/bruços','200m contínuos']), assiduidade: 85 },
  { nivel: 'AVANCADO', ordem: 7, nome: 'Tubarão', animal: 'tubarao', certificacao: 'OURO', descricao: 'Alto desempenho técnico', criterios: JSON.stringify(['Mariposa técnico','Saída competitiva','Viragens sub 1s','400m resistência']), assiduidade: 90 },
  { nivel: 'AVANCADO', ordem: 8, nome: 'Marlim', animal: 'marlim', certificacao: 'OURO', descricao: 'Preparação competitiva', criterios: JSON.stringify(['Tempos de referência','Estratégia de prova','Treino de força','Análise de vídeo']), assiduidade: 90 },
  { nivel: 'AVANCADO', ordem: 9, nome: 'Golfinho', animal: 'golfinho', certificacao: 'OURO', descricao: 'Elite — pronto para competição oficial', criterios: JSON.stringify(['Tempos competitivos','Consistência técnica','Preparação mental','Liderança aquática']), assiduidade: 92 },
];

@Injectable()
export class FasesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const fases = await this.prisma.faseProgressao.findMany({ where: { isActive: true }, orderBy: { ordem: 'asc' } });
    if (fases.length === 0) return this.seed();
    return fases;
  }

  async seed() {
    for (const f of FASES_DEFAULT) {
      await this.prisma.faseProgressao.upsert({
        where: { nivel_ordem: { nivel: f.nivel, ordem: f.ordem } },
        update: {}, create: f,
      });
    }
    return this.prisma.faseProgressao.findMany({ orderBy: { ordem: 'asc' } });
  }

  async findOne(id: string) {
    const f = await this.prisma.faseProgressao.findUnique({ where: { id }, include: { studentFases: { include: { student: true } }, certificados: true } });
    if (!f) throw new NotFoundException('Fase não encontrada');
    return f;
  }

  async progressoAtleta(studentId: string) {
    const fases = await this.findAll();
    const progresso = await this.prisma.studentFase.findMany({ where: { studentId }, include: { fase: true } });
    return fases.map(f => {
      const p = progresso.find(p => p.faseId === f.id);
      return { ...f, progresso: p || { estado: 'NAO_INICIADO' } };
    });
  }

  async updateProgresso(studentId: string, faseId: string, data: any) {
    return this.prisma.studentFase.upsert({
      where: { studentId_faseId: { studentId, faseId } },
      update: data,
      create: { studentId, faseId, ...data },
    });
  }
}
