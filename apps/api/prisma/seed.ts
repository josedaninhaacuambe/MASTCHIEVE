import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────

const hash = (pw: string) => bcrypt.hash(pw, 10);
const uuid = () => require('crypto').randomUUID();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Dados dos Módulos de Natação ─────────────────────────────────────────────

const MODULES = [
  { id: 'mod-adaptacao',  name: 'Adaptação ao Meio Aquático',  level: 'BEGINNER',    order: 1, skills: ['Flutuação dorsal', 'Controlo de respiração', 'Submersão', 'Deslocamento básico'] },
  { id: 'mod-crol',       name: 'Estilo Crol — Fundamentos',   level: 'ELEMENTARY',  order: 2, skills: ['Posição hidrodinâmica', 'Batimento de pernas', 'Puxada alternada', 'Respiração lateral'] },
  { id: 'mod-costas',     name: 'Estilo Costas',               level: 'ELEMENTARY',  order: 3, skills: ['Posição dorsal estável', 'Coordenação braços/pernas', 'Viragem costas', 'Chegada à parede'] },
  { id: 'mod-brucos',     name: 'Estilo Bruços',               level: 'INTERMEDIATE',order: 4, skills: ['Puxada sincronizada', 'Pontapé de bruços', 'Respiração frontal', 'Deslize e planeio'] },
  { id: 'mod-mariposa',   name: 'Estilo Mariposa',             level: 'ADVANCED',    order: 5, skills: ['Ondulação corporal', 'Braçada dupla simultânea', 'Respiração mariposa', 'Coordenação completa'] },
  { id: 'mod-saida',      name: 'Técnica de Saída',            level: 'ADVANCED',    order: 6, skills: ['Saída de bloco partida', 'Reação ao sinal', 'Entrada na água', 'Deslize de saída'] },
  { id: 'mod-viragens',   name: 'Viragens Técnicas',           level: 'ADVANCED',    order: 7, skills: ['Viragem rolamento crol', 'Viragem costas', 'Viragem bruços/mariposa', 'Timing de aproximação'] },
  { id: 'mod-competicao', name: 'Treino de Competição',        level: 'COMPETITIVE', order: 8, skills: ['Estratégia de prova', 'Pacing e distribuição', 'Análise de tempos', 'Preparação psicológica'] },
];

// ── Dados dos Instrutores ────────────────────────────────────────────────────

const INSTRUCTORS = [
  {
    email: 'joao.silva@mastchieve.com',
    firstName: 'João', lastName: 'Silva',
    phone: '+351 912 345 678',
    specializations: ['Natação Técnica', 'Iniciantes', 'Adaptação Aquática'],
    bio: 'Licenciado em Ciências do Desporto pela FMH. 12 anos de experiência em ensino de natação, com formação específica em pedagogia aquática infantil e juvenil. Campeão nacional de natação em 2015.',
  },
  {
    email: 'maria.santos@mastchieve.com',
    firstName: 'Maria', lastName: 'Santos',
    phone: '+351 915 678 901',
    specializations: ['Natação Competitiva', 'Técnica Avançada', 'Viragens e Saídas'],
    bio: 'Ex-nadadora de alta competição com participação em campeonatos europeus. Treinadora certificada pelo Comité Olímpico. Especialista em estilos bruços e mariposa.',
  },
  {
    email: 'pedro.costa@mastchieve.com',
    firstName: 'Pedro', lastName: 'Costa',
    phone: '+351 917 234 567',
    specializations: ['Natação Terapêutica', 'Adultos e Seniores', 'Hidroterapia'],
    bio: 'Fisioterapeuta e técnico de natação. Especializado em programas de reabilitação aquática e natação adaptada. 8 anos de experiência em contexto clínico e desportivo.',
  },
];

// ── Dados dos Atletas ────────────────────────────────────────────────────────

const STUDENTS = [
  // Turma Iniciantes A (João Silva)
  { firstName: 'Sofia',    lastName: 'Ferreira',   dob: '2016-03-14', gender: 'FEMALE', phone: null,              medicalNotes: null,                             parentName: 'Helena Ferreira',   parentPhone: '+351 962 111 222', level: 'BEGINNER' },
  { firstName: 'Tomás',    lastName: 'Rodrigues',  dob: '2015-07-22', gender: 'MALE',   phone: null,              medicalNotes: 'Alergia leve a certos cloros',    parentName: 'Carlos Rodrigues',  parentPhone: '+351 962 333 444', level: 'BEGINNER' },
  { firstName: 'Beatriz',  lastName: 'Almeida',    dob: '2016-11-05', gender: 'FEMALE', phone: null,              medicalNotes: null,                             parentName: 'Susana Almeida',    parentPhone: '+351 962 555 666', level: 'BEGINNER' },
  { firstName: 'Mateus',   lastName: 'Oliveira',   dob: '2015-02-18', gender: 'MALE',   phone: null,              medicalNotes: 'Otites recorrentes — usar tampões', parentName: 'Ana Oliveira',     parentPhone: '+351 962 777 888', level: 'BEGINNER' },
  { firstName: 'Inês',     lastName: 'Carvalho',   dob: '2016-09-30', gender: 'FEMALE', phone: null,              medicalNotes: null,                             parentName: 'Rui Carvalho',      parentPhone: '+351 962 999 000', level: 'BEGINNER' },

  // Turma Iniciantes B (Pedro Costa)
  { firstName: 'André',    lastName: 'Pereira',    dob: '2014-05-12', gender: 'MALE',   phone: null,              medicalNotes: null,                             parentName: 'Paula Pereira',     parentPhone: '+351 963 111 222', level: 'BEGINNER' },
  { firstName: 'Leonor',   lastName: 'Martins',    dob: '2015-08-27', gender: 'FEMALE', phone: null,              medicalNotes: null,                             parentName: 'João Martins',      parentPhone: '+351 963 333 444', level: 'BEGINNER' },
  { firstName: 'Francisco',lastName: 'Sousa',      dob: '2014-12-03', gender: 'MALE',   phone: null,              medicalNotes: 'Asma controlada — inalador na mala', parentName: 'Teresa Sousa', parentPhone: '+351 963 555 666', level: 'BEGINNER' },

  // Turma Intermédio A (João Silva)
  { firstName: 'Mariana',  lastName: 'Lima',       dob: '2012-04-19', gender: 'FEMALE', phone: '+351 910 123 456', medicalNotes: null,                             parentName: 'Fernanda Lima',     parentPhone: '+351 964 111 222', level: 'INTERMEDIATE' },
  { firstName: 'Diogo',    lastName: 'Neves',      dob: '2011-10-08', gender: 'MALE',   phone: '+351 910 234 567', medicalNotes: null,                             parentName: 'Luís Neves',        parentPhone: '+351 964 333 444', level: 'INTERMEDIATE' },
  { firstName: 'Catarina', lastName: 'Gomes',      dob: '2012-06-25', gender: 'FEMALE', phone: '+351 910 345 678', medicalNotes: null,                             parentName: 'Isabel Gomes',      parentPhone: '+351 964 555 666', level: 'INTERMEDIATE' },
  { firstName: 'Rafael',   lastName: 'Teixeira',   dob: '2011-01-14', gender: 'MALE',   phone: '+351 910 456 789', medicalNotes: null,                             parentName: 'Marta Teixeira',    parentPhone: '+351 964 777 888', level: 'INTERMEDIATE' },

  // Turma Avançado (Maria Santos)
  { firstName: 'Ana',      lastName: 'Mendes',     dob: '2009-08-03', gender: 'FEMALE', phone: '+351 911 111 111', medicalNotes: null,                             parentName: 'Paulo Mendes',      parentPhone: '+351 965 111 222', level: 'ADVANCED' },
  { firstName: 'Rodrigo',  lastName: 'Faria',      dob: '2008-03-17', gender: 'MALE',   phone: '+351 911 222 222', medicalNotes: null,                             parentName: 'Cristina Faria',    parentPhone: '+351 965 333 444', level: 'ADVANCED' },
  { firstName: 'Madalena', lastName: 'Azevedo',    dob: '2009-11-29', gender: 'FEMALE', phone: '+351 911 333 333', medicalNotes: null,                             parentName: 'Miguel Azevedo',    parentPhone: '+351 965 555 666', level: 'ADVANCED' },
  { firstName: 'Gonçalo',  lastName: 'Ribeiro',    dob: '2008-07-11', gender: 'MALE',   phone: '+351 911 444 444', medicalNotes: null,                             parentName: 'Sandra Ribeiro',    parentPhone: '+351 965 777 888', level: 'ADVANCED' },

  // Turma Competição (Maria Santos)
  { firstName: 'Joana',    lastName: 'Castro',     dob: '2007-05-22', gender: 'FEMALE', phone: '+351 912 555 555', medicalNotes: null,                             parentName: 'António Castro',    parentPhone: '+351 966 111 222', level: 'COMPETITIVE' },
  { firstName: 'Miguel',   lastName: 'Pinto',      dob: '2006-09-04', gender: 'MALE',   phone: '+351 912 666 666', medicalNotes: null,                             parentName: 'Graça Pinto',       parentPhone: '+351 966 333 444', level: 'COMPETITIVE' },
  { firstName: 'Carolina', lastName: 'Lopes',      dob: '2007-01-16', gender: 'FEMALE', phone: '+351 912 777 777', medicalNotes: null,                             parentName: 'Jorge Lopes',       parentPhone: '+351 966 555 666', level: 'COMPETITIVE' },
  { firstName: 'Tomás',    lastName: 'Araújo',     dob: '2006-12-08', gender: 'MALE',   phone: '+351 912 888 888', medicalNotes: null,                             parentName: 'Filipa Araújo',     parentPhone: '+351 966 777 888', level: 'COMPETITIVE' },
];

// ── Templates de Feedback IA ─────────────────────────────────────────────────

const FEEDBACK_TEMPLATES = {
  BEGINNER: [
    (name: string, score: number) => `${name}, que sessão especial hoje! Estás a fazer progressos incríveis na tua adaptação à água. A tua capacidade de flutuação melhorou muito — notei que já consegues manter a posição horizontal durante mais tempo sem apoio. O próximo passo é trabalhar a respiração: tenta expirar pelo nariz quando a cabeça está dentro de água. Continua com este entusiasmo, estás no caminho certo! 💪`,
    (name: string, score: number) => `${name}, adorei ver a tua confiança na água hoje! Já não precisas de apoio na borda da piscina para te manteres à superfície — isso é um marco enorme. A tua posição corporal está a melhorar aula após aula. Para a próxima sessão, vamos focar no batimento de pernas: lembra-te de mantê-las esticadas e soltar os tornozelos. Bom trabalho hoje!`,
    (name: string, score: number) => `Sessão de hoje para ${name}: foi visível a melhoria na submersão — já consegues abrir os olhos debaixo de água sem dificuldade! A confiança aquática está a crescer a cada aula. Ponto a trabalhar: a posição da cabeça na flutuação dorsal. Tenta relaxar mais o pescoço. Estás a evoluir muito bem para o teu nível. Orgulho no teu esforço!`,
  ],
  ELEMENTARY: [
    (name: string, score: number) => `${name}, a tua técnica de crol está a evoluir visivelmente! Hoje notei uma melhoria significativa na coordenação dos braços com a respiração lateral. A tua posição hidrodinâmica está quase perfeita — lembra-te de manter o corpo paralelo à superfície. O ponto a melhorar é o batimento de pernas: precisa de ser mais contínuo e a partir da anca, não dos joelhos. Sessão muito positiva no geral!`,
    (name: string, score: number) => `Que progresso, ${name}! O teu estilo costas está a tomar forma. A posição dorsal está estável e a coordenação dos braços está melhor a cada sessão. Hoje o destaque foi a tua chegada à parede — fizeste-a de forma limpa e técnica. Para a próxima aula, vamos trabalhar as viragens. Continua a praticar o batimento de pernas na posição dorsal em casa com a visualização mental. Excelente trabalho!`,
    (name: string, score: number) => `${name}, sessão de hoje muito equilibrada! Os teus 4 estilos básicos estão todos a evoluir em paralelo. Destaque para a respiração lateral no crol — já está bastante natural. A área que precisa de mais atenção é a fase de deslize após a viragem: estás a sair muito cedo da posição hidrodinâmica. Vê os vídeos de referência que partilhei. Estás a crescer como nadador(a) a cada aula!`,
  ],
  INTERMEDIATE: [
    (name: string, score: number) => `${name}, sessão de hoje de alta qualidade! O teu estilo bruços está a ganhar maturidade — a sincronização entre a puxada e o pontapé melhorou muito. Nota especial para o deslize: já estás a manter a posição hidro por mais tempo antes de iniciar o próximo ciclo. Ponto de trabalho: a respiração frontal ainda interrompe ligeiramente o ritmo. Tenta que a cabeça suba apenas o suficiente para respirar. Performance nota 8/10 hoje!`,
    (name: string, score: number) => `Excelente sessão, ${name}! A tua resistência está a aumentar claramente — completaste os 800m sem paragens hoje pela primeira vez. Estás a mostrar consistência nas 4 técnicas. O foco da próxima semana deve ser a transição de estilo nas provas de estilos completos. Lembra-te da ordem obrigatória: mariposa, costas, bruços, crol. Velocidade de execução ainda tem margem de melhoria mas a técnica está sólida!`,
    (name: string, score: number) => `${name}, a sessão de hoje focou-se nas viragens e notei uma melhoria real! O rolamento no crol está mais rápido e compacto. Para atingires o teu potencial máximo, precisamos de trabalhar o timing de aproximação à parede — estás a iniciar a viragem muito cedo, o que te custa impulso. Nas próximas 2 semanas, dedica 15 min de cada treino exclusivamente às viragens. A velocidade virá naturalmente com a técnica. Orgulho no teu empenho!`,
  ],
  ADVANCED: [
    (name: string, score: number) => `${name}, sessão de grande nível hoje! A tua mariposa está a atingir um patamar diferente — a ondulação corporal já é fluida e potente. Destaque absoluto para a saída de bloco: reação excelente ao sinal e entrada na água quase perfeita. Ponto técnico a afinar: na segunda puxada de mariposa, os cotovelos estão a baixar ligeiramente antes de terminar a tração. Corrige isto e a velocidade vai aumentar. Estás a fazer história na Mastchieve!`,
    (name: string, score: number) => `Sessão técnica de excelência, ${name}! A análise de vídeo da sessão mostra que o teu tempo de viragem baixou 0.3 segundos comparado com a semana passada — isso é significativo em termos de competição. A tua preparação psicológica pré-prova está mais estável. Para a próxima semana: séries de ritmo 200m para trabalhar o pacing. O objetivo é manter o segundo 100m dentro de 2% do tempo do primeiro. Potencial competitivo altíssimo!`,
    (name: string, score: number) => `${name}, hoje foi uma sessão de referência! Completaste os 1500m em tempo pessoal — parabéns! A gestão de esforço ao longo da prova foi inteligente. Tecnicamente, a tua puxada no estilo crol tem cada vez mais eficiência hidráulica. O que vai fazer a diferença nos próximos meses é a força específica — vamos introduzir trabalho de resistência com palmas e pés de pato na próxima sessão. Continua a acreditar!`,
  ],
  COMPETITIVE: [
    (name: string, score: number) => `${name}, treino de alto rendimento hoje! A série de 10×100m em intervalo foi completada com tempos muito consistentes — desvio padrão de apenas 1.2 segundos, o que demonstra excelente controlo de ritmo. A tua saída de bloco está 0.15s abaixo do teu PB — vamos focar nisto esta semana. Análise biomecânica da semana: a amplitude da passada de crol pode aumentar se trabalharmos a flexibilidade dos ombros. Sessão de stretching amanhã!`,
    (name: string, score: number) => `Sessão de preparação para competição, ${name}! Simulámos as condições da prova e o teu desempenho foi de topo. Tempo nos 100m crol: 58.4s — estás a 0.8s do mínimo nacional para a tua categoria. É atingível. O diferencial vai ser a viragem e a saída — hoje perdeste cerca de 0.4s combinados nessas duas fases vs. a elite. Plano: esta semana são 60% do treino dedicado exclusivamente a técnica de saída e viragem. Acredita!`,
    (name: string, score: number) => `${name}, a consistência que estás a mostrar nos treinos é impressionante! 3 semanas consecutivas sem faltar e com evolução mensurável em todos os marcadores. O teu VO2max estimado (baseado nos tempos) subiu para um nível de atleta nacional. Foco desta fase: pacing nos 200m — a estratégia negativa split (segundo 100m mais rápido que o primeiro) é o teu caminho para o pódio. Acredita no processo. Estás a preparar-te para algo grande!`,
  ],
};

// ── SEED PRINCIPAL ───────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Mastchieve IA — Seed com dados realistas\n');

  // ─── Módulos de natação ──────────────────────────────────────────────────
  console.log('📚 Criando módulos de natação...');
  for (const mod of MODULES) {
    await prisma.swimmingModule.upsert({
      where: { id: mod.id },
      update: {},
      create: {
        id: mod.id,
        name: mod.name,
        level: mod.level,
        order: mod.order,
        skills: JSON.stringify(mod.skills),
      },
    });
  }

  // ─── Admin ───────────────────────────────────────────────────────────────
  console.log('👤 Criando administrador...');
  await prisma.user.upsert({
    where: { email: 'admin@mastchieve.com' },
    update: {},
    create: {
      email: 'admin@mastchieve.com',
      password: await hash('admin123456'),
      role: 'ADMIN',
      admin: {
        create: {
          firstName: 'Ricardo',
          lastName: 'Mendonça',
          phone: '+351 910 000 001',
        },
      },
    },
  });

  // ─── Instrutores ─────────────────────────────────────────────────────────
  console.log('🏊 Criando instrutores...');
  const instructorIds: string[] = [];
  for (const inst of INSTRUCTORS) {
    const user = await prisma.user.upsert({
      where: { email: inst.email },
      update: {},
      create: {
        email: inst.email,
        password: await hash('instructor123'),
        role: 'INSTRUCTOR',
        instructor: {
          create: {
            firstName: inst.firstName,
            lastName: inst.lastName,
            phone: inst.phone,
            specializations: JSON.stringify(inst.specializations),
            bio: inst.bio,
          },
        },
      },
      include: { instructor: true },
    });
    instructorIds.push(user.instructor!.id);
  }

  const [instJoao, instMaria, instPedro] = instructorIds;

  // ─── Turmas ──────────────────────────────────────────────────────────────
  console.log('📋 Criando turmas...');

  const classes = await Promise.all([
    prisma.class.create({
      data: {
        name: 'Iniciantes A — Manhã',
        description: 'Turma de iniciação à natação para crianças dos 6 aos 10 anos. Foco na adaptação ao meio aquático e aprendizagem dos estilos básicos.',
        level: 'BEGINNER', status: 'ACTIVE', maxStudents: 8, poolLane: '1-2',
        schedules: JSON.stringify([
          { dayOfWeek: 1, startTime: '09:30', endTime: '10:15' },
          { dayOfWeek: 3, startTime: '09:30', endTime: '10:15' },
          { dayOfWeek: 5, startTime: '09:30', endTime: '10:15' },
        ]),
        instructorId: instJoao,
      },
    }),
    prisma.class.create({
      data: {
        name: 'Iniciantes B — Tarde',
        description: 'Turma de iniciação à natação para crianças dos 8 aos 12 anos. Introdução aos 4 estilos de natação.',
        level: 'BEGINNER', status: 'ACTIVE', maxStudents: 8, poolLane: '3-4',
        schedules: JSON.stringify([
          { dayOfWeek: 2, startTime: '16:00', endTime: '16:45' },
          { dayOfWeek: 4, startTime: '16:00', endTime: '16:45' },
          { dayOfWeek: 6, startTime: '10:00', endTime: '10:45' },
        ]),
        instructorId: instPedro,
      },
    }),
    prisma.class.create({
      data: {
        name: 'Intermédio A — Tarde',
        description: 'Turma de aperfeiçoamento técnico para nadadores com domínio básico dos 4 estilos. Foco em resistência e técnica.',
        level: 'INTERMEDIATE', status: 'ACTIVE', maxStudents: 10, poolLane: '3-4',
        schedules: JSON.stringify([
          { dayOfWeek: 1, startTime: '18:00', endTime: '19:00' },
          { dayOfWeek: 3, startTime: '18:00', endTime: '19:00' },
          { dayOfWeek: 5, startTime: '18:00', endTime: '19:00' },
        ]),
        instructorId: instJoao,
      },
    }),
    prisma.class.create({
      data: {
        name: 'Avançado — Manhã',
        description: 'Turma de alto rendimento técnico. Aperfeiçoamento dos estilos avançados, viragens, saídas e planeamento de competição.',
        level: 'ADVANCED', status: 'ACTIVE', maxStudents: 8, poolLane: '5-6',
        schedules: JSON.stringify([
          { dayOfWeek: 2, startTime: '07:00', endTime: '08:00' },
          { dayOfWeek: 4, startTime: '07:00', endTime: '08:00' },
          { dayOfWeek: 6, startTime: '08:00', endTime: '09:15' },
        ]),
        instructorId: instMaria,
      },
    }),
    prisma.class.create({
      data: {
        name: 'Competição — Elite',
        description: 'Grupo de competição selecionado. Preparação específica para provas regionais e nacionais. Treinos de alto volume e intensidade.',
        level: 'COMPETITIVE', status: 'ACTIVE', maxStudents: 6, poolLane: '7-8',
        schedules: JSON.stringify([
          { dayOfWeek: 1, startTime: '06:30', endTime: '08:00' },
          { dayOfWeek: 2, startTime: '18:30', endTime: '20:00' },
          { dayOfWeek: 3, startTime: '06:30', endTime: '08:00' },
          { dayOfWeek: 4, startTime: '18:30', endTime: '20:00' },
          { dayOfWeek: 5, startTime: '06:30', endTime: '08:00' },
        ]),
        instructorId: instMaria,
      },
    }),
  ]);

  const [clsIniciantesA, clsIniciantesB, clsIntermedio, clsAvancado, clsCompeticao] = classes;

  // Mapa: nível do estudante → turma
  const levelToClass: Record<string, string> = {
    BEGINNER: clsIniciantesA.id,
    INTERMEDIATE: clsIntermedio.id,
    ADVANCED: clsAvancado.id,
    COMPETITIVE: clsCompeticao.id,
  };

  // ─── Atletas + Pais + Inscrições ─────────────────────────────────────────
  console.log('👧 Criando atletas e encarregados...');
  const studentIds: string[] = [];

  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i];
    const email = `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@atleta.mastchieve.com`
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@.]/g, '');

    // Alguns atletas do nível BEGINNER vão para turma B
    const classId = (i >= 5 && i <= 7)
      ? clsIniciantesB.id
      : levelToClass[s.level] || clsIniciantesA.id;

    const studentUser = await prisma.user.create({
      data: {
        email,
        password: await hash('student123'),
        role: 'STUDENT',
        student: {
          create: {
            firstName: s.firstName,
            lastName: s.lastName,
            dateOfBirth: new Date(s.dob),
            gender: s.gender,
            phone: s.phone || null,
            medicalNotes: s.medicalNotes || null,
            emergencyContact: s.parentName,
            emergencyPhone: s.parentPhone,
            enrollmentDate: daysAgo(randomBetween(60, 180)),
          },
        },
      },
      include: { student: true },
    });
    const studentId = studentUser.student!.id;
    studentIds.push(studentId);

    // Encarregado de educação
    const parentEmail = `${s.parentName.split(' ')[0].toLowerCase()}.encarregado.${i}@email.com`
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@.]/g, '');

    const parentUser = await prisma.user.create({
      data: {
        email: parentEmail,
        password: await hash('parent123'),
        role: 'PARENT',
        parent: {
          create: {
            firstName: s.parentName.split(' ')[0],
            lastName: s.parentName.split(' ').slice(1).join(' ') || 'Encarregado',
            phone: s.parentPhone,
            relationship: i % 3 === 0 ? 'Pai' : 'Mãe',
          },
        },
      },
      include: { parent: true },
    });

    // Ligar pai ao atleta
    await prisma.studentParent.create({
      data: { studentId, parentId: parentUser.parent!.id, isPrimary: true },
    });

    // Inscrição na turma
    await prisma.enrollment.create({
      data: { studentId, classId, enrolledAt: daysAgo(randomBetween(30, 150)) },
    });
  }

  // ─── Sessões de aula (últimos 45 dias) ──────────────────────────────────
  console.log('📅 Criando sessões de aula (45 dias)...');
  const sessionIds: Record<string, string[]> = {
    [clsIniciantesA.id]: [],
    [clsIniciantesB.id]: [],
    [clsIntermedio.id]: [],
    [clsAvancado.id]: [],
    [clsCompeticao.id]: [],
  };

  // Gerar sessões para as últimas 6 semanas (3×/semana para cada turma)
  for (let week = 6; week >= 0; week--) {
    for (const cls of classes) {
      const schedules = JSON.parse(cls.schedules);
      for (const sched of schedules) {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - (week * 7) + (sched.dayOfWeek - 1));
        if (sessionDate > new Date()) continue; // não criar sessões futuras

        const topics: Record<string, string[]> = {
          BEGINNER: ['Flutuação e respiração básica', 'Deslocamento aquático', 'Submersão e adaptação', 'Introdução ao crol', 'Batimento de pernas'],
          ELEMENTARY: ['Técnica de crol — puxada', 'Estilo costas — posição dorsal', 'Coordenação crol completo', 'Respiração lateral', 'Viragem simples'],
          INTERMEDIATE: ['Bruços — puxada e pontapé', 'Séries de resistência 400m', 'Técnica de viragem rolamento', 'Deslize e eficiência', 'Pacing e ritmo'],
          ADVANCED: ['Mariposa — ondulação', 'Saídas de bloco', 'Viragens técnicas avançadas', 'Séries de velocidade', 'Análise de vídeo técnica'],
          COMPETITIVE: ['Séries de alta intensidade', 'Simulação de prova', 'Pacing negativo split', 'Viragens sub 0.5s', 'Preparação mental competição'],
        };

        const session = await prisma.classSession.create({
          data: {
            classId: cls.id,
            sessionDate,
            startTime: sched.startTime,
            endTime: sched.endTime,
            topic: pickRandom(topics[cls.level] || topics.BEGINNER),
            notes: week === 0 ? 'Sessão de hoje — dados a ser processados' : null,
          },
        });
        sessionIds[cls.id].push(session.id);
      }
    }
  }

  // ─── Presenças e Registos de Desempenho ─────────────────────────────────
  console.log('✅ Criando presenças e avaliações de desempenho...');

  // Mapa atleta → turma → instrutor
  const studentClassMap: Record<string, { classId: string; instructorId: string }> = {};
  const enrollments = await prisma.enrollment.findMany({ include: { class: true } });
  for (const e of enrollments) {
    studentClassMap[e.studentId] = {
      classId: e.classId,
      instructorId: e.class.instructorId,
    };
  }

  const performanceRecordIds: string[] = [];

  for (const studentId of studentIds) {
    const info = studentClassMap[studentId];
    if (!info) continue;
    const { classId, instructorId } = info;
    const sessions = sessionIds[classId] || [];

    for (let si = 0; si < sessions.length; si++) {
      const sessionId = sessions[si];
      // 90% presença (realista)
      const present = Math.random() < 0.90;
      const status = present ? 'PRESENT' : (Math.random() < 0.5 ? 'ABSENT' : 'JUSTIFIED');

      await prisma.attendance.upsert({
        where: { sessionId_studentId: { sessionId, studentId } },
        update: {},
        create: {
          sessionId, studentId, instructorId, status,
          markedAt: new Date(Date.now() - si * 24 * 60 * 60 * 1000),
        },
      });

      // Registo de desempenho apenas para sessões presentes (não para todas)
      if (present && si % 2 === 0) {
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        const level = STUDENTS.find(s =>
          s.firstName === student?.firstName && s.lastName === student?.lastName
        )?.level || 'BEGINNER';

        const baseScore = { BEGINNER: 4, ELEMENTARY: 5.5, INTERMEDIATE: 6.5, ADVANCED: 7.5, COMPETITIVE: 8.5 }[level] || 5;
        const progression = si * 0.04; // melhoria gradual ao longo das sessões
        const variance = () => randomFloat(-1, 1);

        const technique    = Math.round(Math.min(10, Math.max(1, baseScore + progression + variance())));
        const stamina      = Math.round(Math.min(10, Math.max(1, baseScore + progression + variance())));
        const speed        = Math.round(Math.min(10, Math.max(1, baseScore - 0.5 + progression + variance())));
        const coordination = Math.round(Math.min(10, Math.max(1, baseScore + 0.5 + progression + variance())));
        const breathing    = Math.round(Math.min(10, Math.max(1, baseScore + progression + variance())));
        const turns        = Math.round(Math.min(10, Math.max(1, baseScore - 1 + progression + variance())));
        const startDive    = Math.round(Math.min(10, Math.max(1, baseScore + 0.2 + progression + variance())));
        const overallScore = parseFloat(((technique + stamina + speed + coordination + breathing + turns + startDive) / 7).toFixed(1));

        const notes = [
          'Boa concentração durante toda a sessão.',
          'Precisa de trabalhar mais a resistência.',
          'Técnica a melhorar gradualmente.',
          'Excelente atitude e esforço hoje!',
          'Dificuldades nas viragens — exercício específico recomendado.',
          'Evolução positiva na respiração.',
          'Sessão completa e produtiva.',
          'Foco na correção postural na próxima sessão.',
        ];

        const record = await prisma.performanceRecord.create({
          data: {
            studentId, sessionId, instructorId,
            technique, stamina, speed, coordination, breathing, turns, startDive, overallScore,
            instructorNotes: pickRandom(notes),
            recordedAt: new Date(Date.now() - si * 24 * 60 * 60 * 1000),
          },
        });
        performanceRecordIds.push(record.id);

        // Criar feedback IA para cada registo de desempenho
        const templates = FEEDBACK_TEMPLATES[level as keyof typeof FEEDBACK_TEMPLATES] || FEEDBACK_TEMPLATES.BEGINNER;
        const feedbackText = pickRandom(templates)(student?.firstName || 'Atleta', overallScore);

        // Variar o status do feedback (histórico realista)
        let feedbackStatus = 'SENT';
        if (si === 0) feedbackStatus = 'PENDING';
        else if (si === 1) feedbackStatus = 'GENERATED';
        else if (si === 2) feedbackStatus = 'REVIEWED';

        await prisma.feedback.create({
          data: {
            studentId, sessionId, instructorId,
            performanceRecordId: record.id,
            status: feedbackStatus,
            aiGeneratedText: feedbackStatus !== 'PENDING' ? feedbackText : null,
            instructorNotes: feedbackStatus === 'REVIEWED' || feedbackStatus === 'SENT'
              ? pickRandom(['Confirmo a avaliação da IA. Excelente sessão!', 'Adicionei foco nas viragens para a próxima sessão.', 'Concordo com a análise. Vamos trabalhar a respiração.', null, null])
              : null,
            finalText: feedbackStatus === 'SENT' ? feedbackText : null,
            aiModel: feedbackStatus !== 'PENDING' ? 'claude-sonnet-4-6' : null,
            aiTokensUsed: feedbackStatus !== 'PENDING' ? randomBetween(280, 420) : null,
            aiConfidenceScore: feedbackStatus !== 'PENDING' ? randomFloat(0.78, 0.97) : null,
            sentToStudentAt: feedbackStatus === 'SENT' ? daysAgo(si) : null,
            createdAt: daysAgo(si + 1),
            updatedAt: daysAgo(si),
          },
        });
      }
    }
  }

  // ─── Progresso por módulo ────────────────────────────────────────────────
  console.log('📈 Criando registos de progresso modular...');

  for (const studentId of studentIds) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    const level = STUDENTS.find(s =>
      s.firstName === student?.firstName && s.lastName === student?.lastName
    )?.level || 'BEGINNER';

    const levelOrder: Record<string, number> = {
      BEGINNER: 1, ELEMENTARY: 2, INTERMEDIATE: 4, ADVANCED: 6, COMPETITIVE: 8
    };
    const maxModuleOrder = levelOrder[level] || 1;

    for (const mod of MODULES) {
      if (mod.order > maxModuleOrder + 1) continue; // só cria progresso até 1 módulo acima do nível

      let status = 'NOT_STARTED';
      let score: number | null = null;
      let startedAt: Date | null = null;
      let completedAt: Date | null = null;

      if (mod.order < maxModuleOrder) {
        status = 'COMPLETED';
        score = randomFloat(6.5, 9.5);
        startedAt = daysAgo(randomBetween(90, 150));
        completedAt = daysAgo(randomBetween(30, 89));
      } else if (mod.order === maxModuleOrder) {
        status = 'IN_PROGRESS';
        score = randomFloat(4.5, 7.5);
        startedAt = daysAgo(randomBetween(10, 30));
      } else {
        status = 'NOT_STARTED';
      }

      await prisma.progress.upsert({
        where: { studentId_moduleId: { studentId, moduleId: mod.id } },
        update: {},
        create: { studentId, moduleId: mod.id, status, score, startedAt, completedAt },
      });
    }
  }

  // ─── Planos de Treino (IA) ───────────────────────────────────────────────
  console.log('📝 Criando planos de treino personalizados...');

  const trainingPlansData = [
    {
      studentIdx: 8, // Mariana Lima — Intermédio
      title: 'Plano de Melhoria de Viragens — 4 Semanas',
      description: 'Plano focado na correção e eficiência das viragens de rolamento no estilo crol e costas, identificadas como área prioritária de melhoria.',
      objectives: ['Reduzir tempo de viragem em 0.3s', 'Melhorar posição hidrodinâmica após viragem', 'Aumentar distância de deslize subaquático'],
      exercises: [
        { name: 'Rolamento na parede', description: 'Praticar o rolamento encostado à parede da piscina', duration: '10 min', sets: 3, reps: 10, notes: 'Foco na compacidade do rolamento' },
        { name: 'Deslize subaquático', description: 'Series de deslize após impulso na parede', duration: '15 min', sets: 4, reps: null, distance: '25m', notes: 'Manter posição 5m mínimo' },
        { name: 'Viragem completa a baixa velocidade', description: 'Repetição da sequência viragem completa com análise técnica', duration: '20 min', sets: 5, reps: 6, notes: 'Filmar para análise em casa' },
        { name: 'Prova de 200m com viragem cronometrada', description: 'Medir tempo total e tempo específico de viragem', duration: '10 min', sets: 2, reps: null, notes: 'Registar evolução no app' },
      ],
    },
    {
      studentIdx: 12, // Ana Mendes — Avançado
      title: 'Programa de Força Específica — Mariposa',
      description: 'Programa de 6 semanas para aumentar a potência de braçada no estilo mariposa através de exercícios de força e técnica específica.',
      objectives: ['Aumentar amplitude de braçada em 15%', 'Melhorar ondulação corporal', 'Reduzir tempo nos 100m mariposa em 1.5s'],
      exercises: [
        { name: 'Palmas na piscina', description: 'Nadar crol e mariposa com palmas para aumentar resistência', duration: '20 min', sets: 6, reps: null, distance: '50m', notes: 'Foco na sensação de água na palma' },
        { name: 'Exercício de ondulação sem braços', description: 'Ondulação corporal apenas com pernas em posição vertical', duration: '10 min', sets: 4, reps: 30, notes: 'Iniciar o movimento na anca, não nos ombros' },
        { name: 'Braçada de mariposa com pull buoy', description: 'Focar apenas na braçada mantendo as pernas paradas', duration: '15 min', sets: 5, reps: null, distance: '25m', notes: 'Cotovelos altos na fase de entrada' },
        { name: 'Sprints de 25m mariposa', description: 'Máxima intensidade para desenvolvimento de potência explosiva', duration: '15 min', sets: 8, reps: null, distance: '25m', notes: 'Recuperação completa entre séries' },
      ],
    },
    {
      studentIdx: 16, // Joana Castro — Competição
      title: 'Pré-Competição — Regionais Setembro 2026',
      description: 'Periodização específica para os Campeonatos Regionais de Setembro. Foco em velocidade, pacing e resistência mental.',
      objectives: ['Atingir mínimo nacional nos 100m crol (sub 58s)', 'Melhorar saída de bloco para sub 0.65s', 'Completar prova com split negativo'],
      exercises: [
        { name: 'Série 10×100m com intervalo controlado', description: 'Manter ritmo de competição em todas as repetições', duration: '45 min', sets: 1, reps: 10, distance: '100m', notes: 'Intervalo: 1min30s. Objetivo: 60-62s por 100m' },
        { name: 'Treino de saída de bloco', description: 'Trabalho específico de reação e entrada na água', duration: '20 min', sets: 10, reps: null, notes: 'Cronometrar reação ao sinal. Objetivo: < 0.65s' },
        { name: 'Simulação de prova 200m com táctica', description: 'Nadar com split negativo: 2º 100m mais rápido que o 1º', duration: '15 min', sets: 3, reps: null, distance: '200m', notes: 'Registar split time no 100m' },
        { name: 'Treino mental de activação pré-prova', description: 'Rotina de visualização, aquecimento e foco', duration: '10 min', sets: 1, reps: null, notes: 'Executar exatamente como no dia da prova' },
      ],
    },
  ];

  for (const plan of trainingPlansData) {
    if (plan.studentIdx >= studentIds.length) continue;
    const studentId = studentIds[plan.studentIdx];
    const info = studentClassMap[studentId];

    await prisma.trainingPlan.create({
      data: {
        studentId,
        instructorId: info?.instructorId || null,
        title: plan.title,
        description: plan.description,
        objectives: JSON.stringify(plan.objectives),
        exercises: JSON.stringify(plan.exercises),
        aiGenerated: true,
        validFrom: daysAgo(14),
        validUntil: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ─── Pagamentos (histórico realista) ────────────────────────────────────
  console.log('💰 Criando histórico de pagamentos...');

  const monthlyAmount = 45; // €45/mês
  const now = new Date();

  for (const studentId of studentIds) {
    // Gerar 3 meses de histórico de pagamentos
    for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 10);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      // Criar mensalidade
      const monthlyFee = await prisma.monthlyFee.upsert({
        where: { studentId_month_year: { studentId, month, year } },
        update: {},
        create: { studentId, month, year, amount: monthlyAmount, dueDate: targetDate },
      });

      // Determinar estado do pagamento
      let status: string;
      let paidAt: Date | null = null;
      const rng = Math.random();

      if (monthOffset === 2) {
        // Há 2 meses: 95% pago
        if (rng < 0.95) { status = 'PAID'; paidAt = new Date(targetDate.getTime() + randomBetween(-5, 10) * 24 * 60 * 60 * 1000); }
        else { status = 'OVERDUE'; }
      } else if (monthOffset === 1) {
        // Mês passado: 88% pago
        if (rng < 0.88) { status = 'PAID'; paidAt = new Date(targetDate.getTime() + randomBetween(-3, 15) * 24 * 60 * 60 * 1000); }
        else if (rng < 0.95) { status = 'OVERDUE'; }
        else { status = 'PENDING'; }
      } else {
        // Mês atual: 55% pago, 30% pendente, 15% atraso
        if (rng < 0.55) { status = 'PAID'; paidAt = new Date(targetDate.getTime() + randomBetween(-2, 5) * 24 * 60 * 60 * 1000); }
        else if (rng < 0.85) { status = 'PENDING'; }
        else { status = 'OVERDUE'; }
      }

      const methods = ['CASH', 'MBWAY', 'BANK_TRANSFER', 'CARD'];

      await prisma.payment.upsert({
        where: { monthlyFeeId: monthlyFee.id },
        update: {},
        create: {
          studentId,
          monthlyFeeId: monthlyFee.id,
          amount: monthlyAmount,
          method: status === 'PAID' ? pickRandom(methods) : 'CASH',
          status,
          paidAt: status === 'PAID' ? paidAt : null,
          dueDate: targetDate,
          receiptNumber: status === 'PAID' ? `REC-${year}${String(month).padStart(2, '0')}-${studentId.slice(0, 6).toUpperCase()}` : null,
          notes: status === 'OVERDUE' ? 'Pagamento em atraso — contactar encarregado' : null,
          createdAt: new Date(targetDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // ─── Notificações ────────────────────────────────────────────────────────
  console.log('🔔 Criando notificações...');

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@mastchieve.com' } });
  if (adminUser) {
    const notifs = [
      { type: 'PAYMENT_DUE', title: '💰 Pagamentos em atraso', body: '3 atletas têm mensalidades em atraso este mês. Clique para ver detalhes.' },
      { type: 'INFO', title: '📊 Relatório semanal disponível', body: 'O resumo de desempenho da semana está pronto. Taxa de assiduidade: 91%.' },
      { type: 'SUCCESS', title: '✅ 20 feedbacks gerados pela IA', body: 'A IA gerou automaticamente feedback para todas as sessões desta semana.' },
      { type: 'WARNING', title: '⚠️ Turma Iniciantes A quase cheia', body: 'A turma Iniciantes A tem 8/8 atletas inscritos. Lista de espera activa.' },
      { type: 'INFO', title: '🏆 Ana Mendes atingiu novo recorde', body: 'Ana Mendes registou o melhor tempo pessoal nos 100m crol: 58.4 segundos.' },
    ];

    for (const n of notifs) {
      await prisma.notification.create({
        data: { userId: adminUser.id, type: n.type, title: n.title, body: n.body, readAt: Math.random() > 0.4 ? daysAgo(randomBetween(0, 3)) : null },
      });
    }
  }

  // ─── KPI Snapshots (últimos 14 dias) ────────────────────────────────────
  console.log('📈 Criando snapshots de KPIs...');

  const totalStudents = studentIds.length;
  for (let day = 14; day >= 1; day--) {
    const activeStudents = totalStudents - Math.floor(Math.random() * 2);
    await prisma.kpiSnapshot.create({
      data: {
        snapshotDate: daysAgo(day),
        totalStudents,
        activeStudents,
        totalInstructors: 3,
        totalClasses: 5,
        attendanceRate: randomFloat(87, 96),
        avgFeedbackScore: randomFloat(7.1, 8.4),
        npsScore: randomFloat(54, 68),
        instructorAdoptionRate: randomFloat(80, 95),
        overduePayments: randomBetween(1, 5),
        monthlyRevenue: parseFloat((activeStudents * monthlyAmount * randomFloat(0.82, 0.97)).toFixed(2)),
      },
    });
  }

  // ─── Resumo final ────────────────────────────────────────────────────────
  const stats = {
    students: await prisma.student.count(),
    instructors: await prisma.instructor.count(),
    classes: await prisma.class.count(),
    sessions: await prisma.classSession.count(),
    attendances: await prisma.attendance.count(),
    performances: await prisma.performanceRecord.count(),
    feedbacks: await prisma.feedback.count(),
    payments: await prisma.payment.count(),
    kpiSnapshots: await prisma.kpiSnapshot.count(),
  };

  console.log('\n══════════════════════════════════════════════');
  console.log('  ✅ SEED COMPLETO — DADOS REAIS INSERIDOS');
  console.log('══════════════════════════════════════════════');
  console.log(`  👤 Atletas:          ${stats.students}`);
  console.log(`  🏊 Instrutores:      ${stats.instructors}`);
  console.log(`  📋 Turmas:           ${stats.classes}`);
  console.log(`  📅 Sessões de aula:  ${stats.sessions}`);
  console.log(`  ✅ Presenças:        ${stats.attendances}`);
  console.log(`  📊 Avaliações:       ${stats.performances}`);
  console.log(`  🤖 Feedbacks IA:     ${stats.feedbacks}`);
  console.log(`  💰 Pagamentos:       ${stats.payments}`);
  console.log(`  📈 KPI Snapshots:    ${stats.kpiSnapshots}`);
  console.log('──────────────────────────────────────────────');
  console.log('  CREDENCIAIS DE ACESSO:');
  console.log('  Admin:      admin@mastchieve.com / admin123456');
  console.log('  Instrutor:  joao.silva@mastchieve.com / instructor123');
  console.log('  Instrutor:  maria.santos@mastchieve.com / instructor123');
  console.log('  Instrutor:  pedro.costa@mastchieve.com / instructor123');
  console.log('  Atleta:     sofia.ferreira@atleta.mastchieve.com / student123');
  console.log('  Atleta:     ana.mendes@atleta.mastchieve.com / student123');
  console.log('══════════════════════════════════════════════\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
