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
exports.FasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../config/prisma/prisma.service");
const FASES_DEFAULT = [
    {
        nivel: 'AMA', ordem: 1, nome: 'Estrela-do-Mar', animal: 'estrela-do-mar', certificacao: 'BRONZE',
        descricao: 'Conforto no meio aquático, respiração ventral e primeiros alinhamentos',
        foco: 'Desenvolver conforto no meio aquático, controlar a respiração ventral e realizar primeiros deslizes alinhados com apoio',
        escala: JSON.stringify(['Não realiza', 'Com apoio', 'Autónomo']),
        criterios: JSON.stringify([
            'Demonstra conforto na água',
            'Respiração ventral (exala dentro de água)',
            'Flutuação ventral com apoio',
            'Flutuação dorsal com apoio',
            'Deslize ventral curto alinhado',
        ]),
        assiduidade: 80,
    },
    {
        nivel: 'AMA', ordem: 2, nome: 'Cavalo-Marinho', animal: 'cavalo-marinho', certificacao: 'BRONZE',
        descricao: 'Flutuação autónoma e alinhamento dorsal/ventral',
        foco: 'Desenvolver flutuação autónoma nas posições ventral, dorsal e vertical, e realizar transições com apoio reduzido',
        escala: JSON.stringify(['Não realiza', 'Parcial', 'Autónomo']),
        criterios: JSON.stringify([
            'Flutuação ventral autónoma por 10 segundos',
            'Flutuação dorsal autónoma por 10 segundos',
            'Flutuação vertical por 30 segundos',
            'Deslize ventral alinhado',
            'Deslize dorsal alinhado',
            'Transição ventral ↔ dorsal',
        ]),
        assiduidade: 80,
    },
    {
        nivel: 'AMA', ordem: 3, nome: 'Polvo', animal: 'polvo', certificacao: 'BRONZE',
        descricao: 'Controlo respiratório, autonomia e transições sem apoio',
        foco: 'Respiração ventral autónoma, flutuação independente nas 3 posições e transições sem apoio; conhecer regras básicas de segurança',
        escala: JSON.stringify(['Não realiza', 'Parcial', 'Autónomo']),
        criterios: JSON.stringify([
            'Respiração ventral controlada',
            'Flutuação ventral e dorsal independente (20s cada)',
            'Flutuação vertical independente (60s)',
            'Deslize com mudança ventral ↔ dorsal',
            'Mantém alinhamento corporal básico',
            'Conhece regras básicas de segurança',
        ]),
        assiduidade: 80,
    },
    {
        nivel: 'INTERMEDIARIO', ordem: 4, nome: 'Tartaruga', animal: 'tartaruga', certificacao: 'PRATA',
        descricao: 'Consciência corporal e deslocamento alinhado',
        foco: 'Desenvolver consciência espacial, executar deslocamento hidrodinâmico ventral e dorsal, e introduzir respiração lateral',
        escala: JSON.stringify(['Insuficiente', 'Satisfatório', 'Bom']),
        criterios: JSON.stringify([
            'Respiração ventral eficaz',
            'Introdução à respiração lateral',
            'Deslocamento ventral alinhado',
            'Deslocamento dorsal alinhado',
            'Pernada alternada contínua',
        ]),
        assiduidade: 85,
    },
    {
        nivel: 'INTERMEDIARIO', ordem: 5, nome: 'Dugongo', animal: 'dugongo', certificacao: 'PRATA',
        descricao: 'Sustentação, propulsão e direção com sculling',
        foco: 'Respiração lateral coordenada, sculling para sustentação e propulsão, deslocamento lateral e introdução às pernadas simétricas',
        escala: JSON.stringify(['Insuficiente', 'Satisfatório', 'Bom']),
        criterios: JSON.stringify([
            'Respiração lateral coordenada',
            'Sculling – sustentação',
            'Sculling – propulsão',
            'Deslocamento lateral',
            'Pernada simétrica (bruços)',
            'Introdução à pernada mariposa',
        ]),
        assiduidade: 85,
    },
    {
        nivel: 'INTERMEDIARIO', ordem: 6, nome: 'Crocodilo', animal: 'crocodilo', certificacao: 'PRATA',
        descricao: 'Controlo direcional e eficiência corporal',
        foco: 'Controlar o eixo corporal, deslocar-se em qualquer posição e direção, e alternar pernadas alternadas e simétricas com resistência crescente',
        escala: JSON.stringify(['Insuficiente', 'Satisfatório', 'Bom', 'Muito Bom']),
        criterios: JSON.stringify([
            'Controla eixo corporal',
            'Desloca-se em qualquer direção',
            'Alterna posições com controlo',
            'Pernada alternada e simétrica eficiente',
            'Conhece regras de segurança intermédia',
        ]),
        assiduidade: 85,
    },
    {
        nivel: 'AVANCADO', ordem: 7, nome: 'Tubarão', animal: 'tubarao', certificacao: 'OURO',
        descricao: 'Fundamentos técnicos de nado',
        foco: 'Desenvolver fundamentos das técnicas de nado: posição corporal hidrodinâmica, propulsão eficiente de pernas e introdução à propulsão de braços',
        escala: JSON.stringify(['Insuficiente', 'Satisfatório', 'Bom']),
        criterios: JSON.stringify([
            'Posição corporal hidrodinâmica',
            'Propulsão de pernas eficiente',
            'Introdução à propulsão de braços',
            'Coordenação básica braços/pernas',
        ]),
        assiduidade: 90,
    },
    {
        nivel: 'AVANCADO', ordem: 8, nome: 'Marlim', animal: 'marlim', certificacao: 'OURO',
        descricao: 'Coordenação técnica consolidada',
        foco: 'Propulsão técnica consolidada, coordenação completa dos estilos e aplicação técnica em séries combinadas com respiração integrada',
        escala: JSON.stringify(['Insuficiente', 'Satisfatório', 'Bom', 'Excelente']),
        criterios: JSON.stringify([
            'Propulsão eficiente braços e pernas',
            'Coordenação completa dos estilos',
            'Respiração integrada ao movimento',
            'Mantém alinhamento sob esforço',
        ]),
        assiduidade: 90,
    },
    {
        nivel: 'AVANCADO', ordem: 9, nome: 'Golfinho', animal: 'golfinho', certificacao: 'OURO',
        descricao: 'Eficiência máxima e resistência',
        foco: 'Eficiência máxima de propulsão, alinhamento corporal em fadiga e aplicação técnica com resistência prolongada em todos os estilos',
        escala: JSON.stringify(['Insuficiente', 'Satisfatório', 'Bom', 'Excelente']),
        criterios: JSON.stringify([
            'Coordenação avançada',
            'Eficiência técnica em todos os estilos',
            'Mantém alinhamento em fadiga',
            'Resistência e continuidade de nado',
        ]),
        assiduidade: 92,
    },
];
let FasesService = class FasesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const fases = await this.prisma.faseProgressao.findMany({ where: { isActive: true }, orderBy: { ordem: 'asc' } });
        if (fases.length === 0)
            return this.seed();
        return fases;
    }
    async seed() {
        for (const f of FASES_DEFAULT) {
            await this.prisma.faseProgressao.upsert({
                where: { nivel_ordem: { nivel: f.nivel, ordem: f.ordem } },
                update: {
                    nome: f.nome,
                    descricao: f.descricao,
                    foco: f.foco,
                    escala: f.escala,
                    criterios: f.criterios,
                    assiduidade: f.assiduidade,
                },
                create: f,
            });
        }
        return this.prisma.faseProgressao.findMany({ orderBy: { ordem: 'asc' } });
    }
    async findOne(id) {
        const f = await this.prisma.faseProgressao.findUnique({ where: { id }, include: { studentFases: { include: { student: true } }, certificados: true } });
        if (!f)
            throw new common_1.NotFoundException('Fase não encontrada');
        return f;
    }
    async progressoAtleta(studentId) {
        const fases = await this.findAll();
        const progresso = await this.prisma.studentFase.findMany({ where: { studentId }, include: { fase: true } });
        return fases.map(f => {
            const p = progresso.find(p => p.faseId === f.id);
            return { ...f, progresso: p || { estado: 'NAO_INICIADO' } };
        });
    }
    async updateProgresso(studentId, faseId, data) {
        return this.prisma.studentFase.upsert({
            where: { studentId_faseId: { studentId, faseId } },
            update: data,
            create: { studentId, faseId, ...data },
        });
    }
};
exports.FasesService = FasesService;
exports.FasesService = FasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FasesService);
//# sourceMappingURL=fases.service.js.map