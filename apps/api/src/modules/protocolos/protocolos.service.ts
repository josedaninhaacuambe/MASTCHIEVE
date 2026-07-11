import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma/prisma.service';

const SEED_PROTOCOLOS = [
  {
    ranking: 1,
    nome: 'Relâmpago Zero — Evacuação Imediata do Meio Aquático',
    dimensao: 'FISICA',
    prioridade: 'CRITICO',
    justificacao: 'A presença de relâmpago ou trovão representa risco de eletrocussão imediata em meio aquático. Este é o único protocolo onde o instrutor tem autoridade total para agir sem esperar aprovação superior.',
    objetivo: 'Evacuar todos os atletas da água de forma imediata e segura perante qualquer sinal de trovoada, sem esperar autorização hierárquica.',
    momentoAplicacao: 'Imediatamente ao primeiro sinal de relâmpago ou trovão, mesmo que a chuva ainda não tenha começado.',
    responsavel: 'Instrutor (autonomia total — notificação à supervisão ocorre APÓS a ação)',
    procedimento: 'SAIR DA ÁGUA. Não perguntar. Não esperar. 1) Sinalizar "SAIR" com voz firme para todos os atletas. 2) Acompanhar saída em fila ordeira. 3) Afastar-se da piscina mínimo 30 metros. 4) Abrigar em estrutura coberta não metálica. 5) Registar na app como RELÂMPAGO ZERO. 6) Notificar coordenação. 7) Aguardar 30 minutos após o último trovão para retomar.',
    checklistItems: JSON.stringify([
      'Verificar condições meteorológicas a cada 30 minutos durante a aula',
      'Conhecer a rota de evacuação e o abrigo mais próximo',
      'Verificar que a saída de emergência da piscina está desobstruída',
      'Confirmar que todos os atletas saíram da água',
      'Aguardar mínimo 30 min após o último trovão para retomar'
    ]),
    sinaisAlerta: JSON.stringify([
      'Relâmpago visível em qualquer direção',
      'Trovão audível (mesmo distante)',
      'Escurecimento rápido do céu',
      'Vento forte repentino',
      'Aplicação meteorológica indica trovoada nos 30 km'
    ]),
    acaoFalha: 'Se algum atleta recusar sair: ação física (pegar pelo braço) e retirar. A segurança supera qualquer objeção. Registar recusa no relatório.',
    isRelampago: true,
  },
  {
    ranking: 2,
    nome: 'Entrada Segura na Piscina',
    dimensao: 'FISICA',
    prioridade: 'MUITO_ALTO',
    justificacao: 'A entrada desordenada na piscina é uma das principais causas de acidentes (choques, afogamentos, pânico). Inclui dimensão emocional (medo da água) e operacional (sequência de entrada).',
    objetivo: 'Garantir que cada atleta entra na piscina de forma controlada, consciente da profundidade e do seu nível real, eliminando entradas em pânico ou por pressão do grupo.',
    momentoAplicacao: 'Início de cada aula, e sempre que um atleta sai e volta a entrar.',
    responsavel: 'Instrutor',
    procedimento: '1) Instrutor já está dentro de água ou na borda. 2) Chamada nominal por ordem — um de cada vez. 3) Verificar expressão/postura do atleta antes de entrar. 4) Entrada sempre pelos degraus ou escada (nunca saltar) para nível AMA. 5) Confirmar que o pé toca o fundo ou que o atleta está em zona segura para o seu nível.',
    checklistItems: JSON.stringify([
      'Confirmar temperatura da água antes da aula',
      'Verificar que a borda está seca e sem obstáculos',
      'Chamada nominal antes da entrada',
      'Observar expressão de cada atleta na entrada',
      'Confirmar zona de profundidade adequada ao nível do atleta'
    ]),
    sinaisAlerta: JSON.stringify([
      'Atleta hesita ou recua na borda',
      'Expressão de pânico ou choro',
      'Temperatura da água abaixo de 28°C',
      'Borda molhada e escorregadia',
      'Atleta novo sem avaliação inicial registada'
    ]),
    acaoFalha: 'Atleta que demonstre medo: não forçar. Adaptar entrada (exemplo: sentar na borda, molhar os pés). Registar em observações de avaliação inicial se for a primeira vez.',
    isRelampago: false,
  },
  {
    ranking: 3,
    nome: 'Supervisão Ativa, Contagem e Controlo de Turma',
    dimensao: 'OPERACIONAL',
    prioridade: 'MUITO_ALTO',
    justificacao: 'A maioria dos acidentes de afogamento em contexto supervisionado ocorre por perda visual momentânea do instrutor. A supervisão ativa é a principal barreira preventiva.',
    objetivo: 'Manter visibilidade constante de todos os atletas durante toda a aula, com contagens regulares para detetar ausências imediatamente.',
    momentoAplicacao: 'Durante toda a aula, sem exceção.',
    responsavel: 'Instrutor (nunca delegar supervisão a um aluno)',
    procedimento: '1) Contagem antes de entrar. 2) Posicionamento em ângulo que permite ver toda a piscina. 3) Contagem a cada 5 minutos ou a cada mudança de exercício. 4) Nunca virar costas à piscina por mais de 3 segundos. 5) Em caso de número errado na contagem: parar aula imediatamente, nova contagem, se ainda faltar alguém activar protocolo de emergência.',
    checklistItems: JSON.stringify([
      'Contagem no início (confirmação de presenças)',
      'Posicionamento permite ver todos os atletas',
      'Contagem após cada exercício ou cada 5 minutos',
      'Identificar atletas de maior risco (fases iniciais, AMA)',
      'Contagem final antes de autorizar saída da piscina'
    ]),
    sinaisAlerta: JSON.stringify([
      'Atleta não responde à chamada',
      'Número de atletas não corresponde ao esperado',
      'Atleta parado no fundo sem movimento',
      'Grupo muito disperso — impossível ver todos',
      'Distração prolongada do instrutor'
    ]),
    acaoFalha: 'Número errado: parar tudo. Não retomar até confirmar localização de todos. Se houver atleta em perigo: acionar socorro imediatamente (chegar à borda, gritar, atirar boia, entrar na água se necessário).',
    isRelampago: false,
  },
  {
    ranking: 4,
    nome: 'Diagnóstico Individual e Progressão AMA Segura',
    dimensao: 'PEDAGOGICA',
    prioridade: 'MUITO_ALTO',
    justificacao: 'A classificação de alunos em bloco (por turma) em vez de individualmente é identificada como risco de segurança pedagógica. "Falsa autonomia" e "progressão insegura sem perceção do atleta" são os efeitos principais.',
    objetivo: 'Garantir que cada atleta progride de fase apenas com base no seu diagnóstico individual, nunca em avaliação de grupo ou por aproximação.',
    momentoAplicacao: 'Avaliação inicial no momento de inscrição; reavaliação antes de cada transição de fase.',
    responsavel: 'Instrutor (validado pelo coordenador pedagógico)',
    procedimento: '1) Avaliação inicial obrigatória por atleta — não por turma. 2) Registar individualmente os 4 critérios (experienciaAquatica, segurancaAdaptacao, confortoAgua, resistenciaBasica). 3) Fase recomendada deve corresponder ao critério mais baixo, não à média. 4) Proibido copiar avaliação de um atleta para outro. 5) Transição de fase requer aprovação do coordenador. 6) Em caso de dúvida: recuar para a fase anterior, nunca avançar.',
    checklistItems: JSON.stringify([
      'Avaliação inicial registada individualmente (não em grupo)',
      'Todos os 4 critérios preenchidos por atleta',
      'Fase recomendada validada pelo coordenador',
      'Atleta informado da sua fase atual e objetivos',
      'Reavaliação agendada se houver stagnação por 2+ semanas'
    ]),
    sinaisAlerta: JSON.stringify([
      'Atleta demonstra dificuldade em exercícios da sua fase',
      'Atleta recusa ou evita determinado exercício sem motivo claro',
      'Discrepância entre comportamento na aula e fase registada',
      'Instrutor avaliou turma inteira ao mesmo tempo',
      'Mesma nota para múltiplos atletas sem justificação individual'
    ]),
    acaoFalha: 'Atleta mal classificado: corrigir imediatamente a fase, notificar encarregado se for menor, registar ocorrência. A app bloqueia avaliação em bloco — cada registo exige seleção individual de atleta.',
    isRelampago: false,
  },
  {
    ranking: 5,
    nome: 'Comunicação Emocional Segura',
    dimensao: 'EMOCIONAL',
    prioridade: 'ALTO',
    justificacao: 'Tom de voz inadequado, pressão de colegas ou abordagem agressiva provoca pânico, bloqueio emocional e obediência por medo — que é o oposto da segurança. O ambiente emocional é um vetor de risco real.',
    objetivo: 'Criar um ambiente de aprendizagem onde o atleta comunica o seu medo ou dificuldade sem sentir vergonha, permitindo ao instrutor detetar risco precocemente.',
    momentoAplicacao: 'Durante toda a aula, especialmente no primeiro contacto com novos exercícios.',
    responsavel: 'Instrutor',
    procedimento: '1) Tom de voz calmo e assertivo — nunca gritado ou impaciente. 2) Validar emoções: "É normal ter medo, vamos devagar". 3) Nunca expor um atleta ao ridículo perante o grupo. 4) Perguntar individualmente: "Estás confortável?" antes de avançar. 5) Se atleta sinalizar desconforto: parar, adaptar, nunca pressionar.',
    checklistItems: JSON.stringify([
      'Apresentar o exercício com demonstração antes de pedir execução',
      'Verificar expressão facial e linguagem corporal dos atletas',
      'Oferecer alternativa de dificuldade menor sempre que possível',
      'Elogiar tentativa, não apenas resultado',
      'Terminar aula com momento positivo para todos'
    ]),
    sinaisAlerta: JSON.stringify([
      'Atleta chora ou recusa participar sem explicação',
      'Atleta visivelmente tenso ou com respiração agitada fora da água',
      'Comportamento de "obediência forçada" sem vontade real',
      'Conflito entre atletas (pressão social)',
      'Atleta que evita olhar para o instrutor'
    ]),
    acaoFalha: 'Se instrutor usar linguagem inadequada: conversa individual, registo no sistema, comunicação ao coordenador. Se atleta em colapso emocional: retirar da piscina, acalmar, contactar encarregado.',
    isRelampago: false,
  },
  {
    ranking: 6,
    nome: 'Controlo da Temperatura da Água e Proteção contra o Frio',
    dimensao: 'FISICA',
    prioridade: 'ALTO',
    justificacao: 'Hipotermia e cãibras são riscos reais em piscinas sem controlo de temperatura, especialmente em crianças. A perda de controlo muscular por frio é causa direta de afogamento.',
    objetivo: 'Garantir que a temperatura da água está dentro dos limites seguros e que sinais de hipotermia são identificados precocemente.',
    momentoAplicacao: 'Antes da aula (verificação) e durante a aula (observação contínua).',
    responsavel: 'Instrutor + responsável da instalação',
    procedimento: '1) Verificar temperatura antes da aula (mínimo 28°C para AMA, 26°C para outros níveis). 2) Se temperatura abaixo do mínimo: reportar à gestão, reduzir tempo de permanência na água, aumentar atividade. 3) Observar lábios azuis, tremores, letargia como sinais de hipotermia. 4) Atleta com sinais: sair da água imediatamente, agasalhar, não reentrar na aula.',
    checklistItems: JSON.stringify([
      'Verificar temperatura da água antes do início da aula',
      'Confirmar que o termómetro está calibrado',
      'Observar atletas para sinais de frio nos primeiros 10 minutos',
      'Ter toalhas disponíveis para caso de necessidade',
      'Registar temperatura no diário de aula'
    ]),
    sinaisAlerta: JSON.stringify([
      'Temperatura da água abaixo de 28°C (para AMA)',
      'Lábios azuis ou arroxeados em qualquer atleta',
      'Tremores visíveis fora da água',
      'Atleta letárgico ou com movimentos descoordenados',
      'Queixas de dor muscular (possível cãibra)'
    ]),
    acaoFalha: 'Atleta com hipotermia: saída imediata, agasalhar, aquecer gradualmente (não com calor direto), contactar encarregado, avaliar necessidade de assistência médica. Registar como incidente.',
    isRelampago: false,
  },
  {
    ranking: 7,
    nome: 'Dosagem de Exercícios e Prevenção de Fadiga',
    dimensao: 'FISICA',
    prioridade: 'ALTO',
    justificacao: 'A fadiga reduz capacidade de flutuar, coordenar e reagir. Um atleta exausto é um atleta em risco, mesmo em fases avançadas.',
    objetivo: 'Controlar a intensidade e duração dos exercícios para evitar fadiga extrema que comprometa a segurança do atleta.',
    momentoAplicacao: 'Durante toda a aula, especialmente na segunda metade.',
    responsavel: 'Instrutor',
    procedimento: '1) Pausas de recuperação a cada 15-20 minutos. 2) Nunca forçar atleta visivelmente exausto a continuar exercício aquático. 3) Intensidade progressiva — começar leve, não o contrário. 4) Verificar frequência cardíaca e respiração regularmente. 5) Última série de exercícios nunca deve ser a mais intensa.',
    checklistItems: JSON.stringify([
      'Planear pausas no plano de aula',
      'Observar ritmo respiratório dos atletas',
      'Não ultrapassar 80% da capacidade dos atletas mais fracos da turma',
      'Exercícios de recuperação no final da aula',
      'Confirmar que todos os atletas estão hidratados antes de entrar'
    ]),
    sinaisAlerta: JSON.stringify([
      'Atleta com dificuldade em manter flutuação',
      'Movimentos descoordenados num atleta normalmente coordenado',
      'Respiração acelerada e superficial persistente',
      'Atleta para no meio do exercício sem motivo técnico',
      'Queixas de dor muscular ou tontura'
    ]),
    acaoFalha: 'Atleta exausto: saída imediata, descanso de pelo menos 10 minutos, reavaliação antes de reentrar. Se sintomas persistirem: não reentrar, contactar encarregado.',
    isRelampago: false,
  },
  {
    ranking: 8,
    nome: 'Uso Adequado de Materiais Didáticos',
    dimensao: 'FISICA',
    prioridade: 'ALTO',
    justificacao: 'Materiais em mau estado ou usados incorretamente podem causar afogamento (ex: prancha que escorrega) ou lesões. O uso errado de materiais de flutuação cria dependência e atrasa progressão.',
    objetivo: 'Garantir que todos os materiais estão em bom estado e são usados de forma pedagogicamente segura, sem criar dependências de flutuação artificiais.',
    momentoAplicacao: 'Antes da aula (inspeção) e durante a aula (supervisão do uso).',
    responsavel: 'Instrutor',
    procedimento: '1) Inspecionar todos os materiais antes da aula (pranchas, pull-buoys, barbatanas, braçadeiras). 2) Materiais com fendas, desgaste ou ausência de flutuação: retirar de circulação. 3) Instrução verbal e demonstração antes de entregar material. 4) Nunca usar braçadeiras em água profunda sem supervisão próxima. 5) Recolher todos os materiais no final.',
    checklistItems: JSON.stringify([
      'Inspecionar materiais antes da aula (fendas, desgaste, flutuação)',
      'Retirar materiais danificados antes da aula',
      'Instruir verbalmente o uso correto antes de entregar',
      'Observar o uso durante o exercício',
      'Recolher e arrumar todos os materiais no final'
    ]),
    sinaisAlerta: JSON.stringify([
      'Prancha com fenda ou perda de flutuação',
      'Atleta usando material de forma invertida ou incorreta',
      'Material obstrui zona de passagem ou saída',
      'Atleta com braçadeira em zona fora do alcance do instrutor',
      'Material em falta no armazém'
    ]),
    acaoFalha: 'Material danificado encontrado em uso: interromper exercício, retirar material, substituir ou adaptar exercício. Registar material defeituoso para substituição.',
    isRelampago: false,
  },
  {
    ranking: 9,
    nome: 'Regras, Autoridade e Disciplina na Aula',
    dimensao: 'OPERACIONAL',
    prioridade: 'ALTO',
    justificacao: 'Sem regras claras e consistentemente aplicadas, a desordem torna impossível a supervisão ativa e aumenta o risco de acidentes por comportamentos impulsivos.',
    objetivo: 'Estabelecer regras de comportamento claras desde o início, aplicadas de forma consistente, que permitam ao instrutor manter controlo e segurança do grupo.',
    momentoAplicacao: 'Primeiro dia de aula e reforço semanal; imediatamente em caso de violação.',
    responsavel: 'Instrutor',
    procedimento: '1) Apresentar regras na primeira aula (máximo 5 regras simples e visuais). 2) Consequências definidas e conhecidas antes de ocorrerem. 3) Em caso de violação: consequência imediata, consistente, sem negociação. 4) Nunca ceder a comportamentos de risco por pressão do atleta. 5) Comportamento grave (empurrar colega, desobedecer em situação de emergência): saída imediata da piscina, comunicação à coordenação.',
    checklistItems: JSON.stringify([
      'Regras afixadas ou comunicadas no início da aula',
      'Consequências conhecidas por todos',
      'Sem exceções para situações de segurança',
      'Registo de comportamentos graves no sistema',
      'Comunicação à família em caso de incidente comportamental'
    ]),
    sinaisAlerta: JSON.stringify([
      'Atleta empurra ou interfere fisicamente com outro',
      'Desobediência direta em situação de segurança (ex: entrar sem ordem)',
      'Comportamento de desafio escalante',
      'Conflito físico entre atletas',
      'Atleta sai da piscina sem autorização'
    ]),
    acaoFalha: 'Comportamento grave: parar aula, abordar individualmente, registar, comunicar à coordenação. Se reincidente: proposta de suspensão temporária com conhecimento da família.',
    isRelampago: false,
  },
  {
    ranking: 10,
    nome: 'Registo de Ocorrências e Quase-Incidentes',
    dimensao: 'GESTAO',
    prioridade: 'ESTRUTURANTE',
    justificacao: 'Sem registo de quase-incidentes, o sistema não tem dados para prevenir os próximos. A meta "zero incidentes graves" só é significativa se os quase-incidentes também forem monitorizados como sinais de alerta precoce.',
    objetivo: 'Garantir registo sistemático de todas as ocorrências — incluindo quase-incidentes — como base para a melhoria contínua da segurança.',
    momentoAplicacao: 'Imediatamente após qualquer ocorrência ou quase-ocorrência. Prazo máximo: 24 horas.',
    responsavel: 'Instrutor (registo primário); coordenador (revisão e escalamento)',
    procedimento: '1) Qualquer ocorrência, por menor que pareça, deve ser registada. 2) Quase-incidente tem o mesmo formulário que incidente confirmado. 3) Campos obrigatórios: tipo de ocorrência, dimensão(ões) afetada(s), descrição, ação imediata, protocolo violado (se aplicável). 4) Prazo: até 24 horas após a ocorrência. 5) Coordenador revê semanalmente e identifica padrões.',
    checklistItems: JSON.stringify([
      'Registar no mesmo dia (máximo 24h após ocorrência)',
      'Classificar como Incidente Confirmado ou Quase-Incidente',
      'Selecionar dimensão(ões) de risco afetada(s)',
      'Indicar protocolo relacionado (se aplicável)',
      'Descrever ação imediata tomada'
    ]),
    sinaisAlerta: JSON.stringify([
      'Mais de 2 quase-incidentes com o mesmo protocolo na mesma semana',
      'Mesmo instrutor com 3+ ocorrências em 30 dias',
      'Mesma turma com 2+ ocorrências em 30 dias',
      'Nenhum registo numa semana com aulas realizadas',
      'Ocorrências sem ação imediata registada'
    ]),
    acaoFalha: 'Ocorrência não registada descoberta: registar retroativamente com nota de atraso. Padrão de não-registo: ação corretiva sobre o instrutor, formação, possível advertência.',
    isRelampago: false,
  },
];

@Injectable()
export class ProtocolosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const count = await this.prisma.protocolo.count();
    if (count === 0) await this.seed();
    return this.prisma.protocolo.findMany({
      where: { isAtivo: true },
      orderBy: { ranking: 'asc' },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.protocolo.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Protocolo não encontrado');
    return p;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.protocolo.update({ where: { id }, data });
  }

  async stats() {
    const protocolos = await this.findAll();
    const incidentesPorProtocolo = await this.prisma.incidente.groupBy({
      by: ['protocoloId'],
      _count: { id: true },
      where: { protocoloId: { not: null } },
    });
    const map = new Map(incidentesPorProtocolo.map((r) => [r.protocoloId, r._count.id]));
    return protocolos.map((p) => ({ ...p, incidentesCount: map.get(p.id) || 0 }));
  }

  private async seed() {
    for (const p of SEED_PROTOCOLOS) {
      await this.prisma.protocolo.upsert({
        where: { ranking: p.ranking },
        create: p,
        update: {},
      });
    }
  }

  // Checklists
  async createChecklist(data: any, instrutorId: string) {
    const protocolo = await this.findOne(data.protocoloId);
    const items = JSON.parse(protocolo.checklistItems as string).map((texto: string) => ({ texto, checked: false }));
    return this.prisma.checklistProtocolo.create({
      data: { ...data, instrutorId, items: JSON.stringify(items) },
    });
  }

  async updateChecklist(id: string, data: any) {
    return this.prisma.checklistProtocolo.update({ where: { id }, data });
  }

  async findChecklists(query: any = {}) {
    const where: any = {};
    if (query.protocoloId) where.protocoloId = query.protocoloId;
    if (query.instrutorId) where.instrutorId = query.instrutorId;
    if (query.sessionId) where.sessionId = query.sessionId;
    return this.prisma.checklistProtocolo.findMany({
      where,
      orderBy: { data: 'desc' },
      include: {
        protocolo: { select: { nome: true, ranking: true, dimensao: true } },
        instrutor: { select: { firstName: true, lastName: true } },
      },
    });
  }
}
