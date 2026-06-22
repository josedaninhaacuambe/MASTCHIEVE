'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const hash = (pw) => bcrypt.hash(pw, 10);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomFloat(min, max, decimals = 1) { return parseFloat((Math.random() * (max - min) + min).toFixed(decimals)); }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const MODULES = [
  { id: 'mod-adaptacao',  name: 'Adaptação ao Meio Aquático',  level: 'BEGINNER',    order: 1, skills: ['Flutuação dorsal','Controlo de respiração','Submersão','Deslocamento básico'] },
  { id: 'mod-crol',       name: 'Estilo Crol — Fundamentos',   level: 'ELEMENTARY',  order: 2, skills: ['Posição hidrodinâmica','Batimento de pernas','Puxada alternada','Respiração lateral'] },
  { id: 'mod-costas',     name: 'Estilo Costas',               level: 'ELEMENTARY',  order: 3, skills: ['Posição dorsal estável','Coordenação braços/pernas','Viragem costas','Chegada à parede'] },
  { id: 'mod-brucos',     name: 'Estilo Bruços',               level: 'INTERMEDIATE',order: 4, skills: ['Puxada sincronizada','Pontapé de bruços','Respiração frontal','Deslize e planeio'] },
  { id: 'mod-mariposa',   name: 'Estilo Mariposa',             level: 'ADVANCED',    order: 5, skills: ['Ondulação corporal','Braçada dupla simultânea','Respiração mariposa','Coordenação completa'] },
  { id: 'mod-saida',      name: 'Técnica de Saída',            level: 'ADVANCED',    order: 6, skills: ['Saída de bloco partida','Reação ao sinal','Entrada na água','Deslize de saída'] },
  { id: 'mod-viragens',   name: 'Viragens Técnicas',           level: 'ADVANCED',    order: 7, skills: ['Viragem rolamento crol','Viragem costas','Viragem bruços/mariposa','Timing de aproximação'] },
  { id: 'mod-competicao', name: 'Treino de Competição',        level: 'COMPETITIVE', order: 8, skills: ['Estratégia de prova','Pacing e distribuição','Análise de tempos','Preparação psicológica'] },
];

const INSTRUCTORS = [
  { email: 'joao.silva@mastchieve.com',   firstName: 'João',  lastName: 'Silva',   phone: '+258 84 111 1111', specializations: ['Natação Técnica','Iniciantes','Adaptação Aquática'], bio: 'Licenciado em Ciências do Desporto. 12 anos de experiência em ensino de natação.' },
  { email: 'maria.santos@mastchieve.com', firstName: 'Maria', lastName: 'Santos',  phone: '+258 84 222 2222', specializations: ['Natação Competitiva','Técnica Avançada','Viragens e Saídas'], bio: 'Ex-nadadora de alta competição. Treinadora certificada pelo Comité Olímpico.' },
  { email: 'pedro.costa@mastchieve.com',  firstName: 'Pedro', lastName: 'Costa',   phone: '+258 84 333 3333', specializations: ['Natação Terapêutica','Adultos e Seniores','Hidroterapia'], bio: 'Fisioterapeuta e técnico de natação. Especializado em reabilitação aquática.' },
];

const STUDENTS = [
  { firstName: 'Sofia',     lastName: 'Ferreira',  dob: '2016-03-14', gender: 'FEMALE', phone: null,              medicalNotes: null,                               parentName: 'Helena Ferreira',  parentPhone: '+258 84 400 0001', level: 'BEGINNER' },
  { firstName: 'Tomás',     lastName: 'Rodrigues', dob: '2015-07-22', gender: 'MALE',   phone: null,              medicalNotes: 'Alergia leve a certos cloros',      parentName: 'Carlos Rodrigues', parentPhone: '+258 84 400 0002', level: 'BEGINNER' },
  { firstName: 'Beatriz',   lastName: 'Almeida',   dob: '2016-11-05', gender: 'FEMALE', phone: null,              medicalNotes: null,                               parentName: 'Susana Almeida',   parentPhone: '+258 84 400 0003', level: 'BEGINNER' },
  { firstName: 'Mateus',    lastName: 'Oliveira',  dob: '2015-02-18', gender: 'MALE',   phone: null,              medicalNotes: 'Otites recorrentes — usar tampões', parentName: 'Ana Oliveira',     parentPhone: '+258 84 400 0004', level: 'BEGINNER' },
  { firstName: 'Inês',      lastName: 'Carvalho',  dob: '2016-09-30', gender: 'FEMALE', phone: null,              medicalNotes: null,                               parentName: 'Rui Carvalho',     parentPhone: '+258 84 400 0005', level: 'BEGINNER' },
  { firstName: 'André',     lastName: 'Pereira',   dob: '2014-05-12', gender: 'MALE',   phone: null,              medicalNotes: null,                               parentName: 'Paula Pereira',    parentPhone: '+258 84 400 0006', level: 'BEGINNER' },
  { firstName: 'Leonor',    lastName: 'Martins',   dob: '2015-08-27', gender: 'FEMALE', phone: null,              medicalNotes: null,                               parentName: 'João Martins',     parentPhone: '+258 84 400 0007', level: 'BEGINNER' },
  { firstName: 'Francisco', lastName: 'Sousa',     dob: '2014-12-03', gender: 'MALE',   phone: null,              medicalNotes: 'Asma controlada — inalador na mala',parentName: 'Teresa Sousa',     parentPhone: '+258 84 400 0008', level: 'BEGINNER' },
  { firstName: 'Mariana',   lastName: 'Lima',      dob: '2012-04-19', gender: 'FEMALE', phone: '+258 84 500 0001', medicalNotes: null,                               parentName: 'Fernanda Lima',    parentPhone: '+258 84 400 0009', level: 'INTERMEDIATE' },
  { firstName: 'Diogo',     lastName: 'Neves',     dob: '2011-10-08', gender: 'MALE',   phone: '+258 84 500 0002', medicalNotes: null,                               parentName: 'Luís Neves',       parentPhone: '+258 84 400 0010', level: 'INTERMEDIATE' },
  { firstName: 'Catarina',  lastName: 'Gomes',     dob: '2012-06-25', gender: 'FEMALE', phone: '+258 84 500 0003', medicalNotes: null,                               parentName: 'Isabel Gomes',     parentPhone: '+258 84 400 0011', level: 'INTERMEDIATE' },
  { firstName: 'Rafael',    lastName: 'Teixeira',  dob: '2011-01-14', gender: 'MALE',   phone: '+258 84 500 0004', medicalNotes: null,                               parentName: 'Marta Teixeira',   parentPhone: '+258 84 400 0012', level: 'INTERMEDIATE' },
  { firstName: 'Ana',       lastName: 'Mendes',    dob: '2009-08-03', gender: 'FEMALE', phone: '+258 84 600 0001', medicalNotes: null,                               parentName: 'Paulo Mendes',     parentPhone: '+258 84 400 0013', level: 'ADVANCED' },
  { firstName: 'Rodrigo',   lastName: 'Faria',     dob: '2008-03-17', gender: 'MALE',   phone: '+258 84 600 0002', medicalNotes: null,                               parentName: 'Cristina Faria',   parentPhone: '+258 84 400 0014', level: 'ADVANCED' },
  { firstName: 'Madalena',  lastName: 'Azevedo',   dob: '2009-11-29', gender: 'FEMALE', phone: '+258 84 600 0003', medicalNotes: null,                               parentName: 'Miguel Azevedo',   parentPhone: '+258 84 400 0015', level: 'ADVANCED' },
  { firstName: 'Gonçalo',   lastName: 'Ribeiro',   dob: '2008-07-11', gender: 'MALE',   phone: '+258 84 600 0004', medicalNotes: null,                               parentName: 'Sandra Ribeiro',   parentPhone: '+258 84 400 0016', level: 'ADVANCED' },
  { firstName: 'Joana',     lastName: 'Castro',    dob: '2007-05-22', gender: 'FEMALE', phone: '+258 84 700 0001', medicalNotes: null,                               parentName: 'António Castro',   parentPhone: '+258 84 400 0017', level: 'COMPETITIVE' },
  { firstName: 'Miguel',    lastName: 'Pinto',     dob: '2006-09-04', gender: 'MALE',   phone: '+258 84 700 0002', medicalNotes: null,                               parentName: 'Graça Pinto',      parentPhone: '+258 84 400 0018', level: 'COMPETITIVE' },
  { firstName: 'Carolina',  lastName: 'Lopes',     dob: '2007-01-16', gender: 'FEMALE', phone: '+258 84 700 0003', medicalNotes: null,                               parentName: 'Jorge Lopes',      parentPhone: '+258 84 400 0019', level: 'COMPETITIVE' },
  { firstName: 'Tomás',     lastName: 'Araújo',    dob: '2006-12-08', gender: 'MALE',   phone: '+258 84 700 0004', medicalNotes: null,                               parentName: 'Filipa Araújo',    parentPhone: '+258 84 400 0020', level: 'COMPETITIVE' },
];

async function main() {
  console.log('\n🌱 Mastchieve IA — Seed completo\n');

  // Módulos
  console.log('📚 Módulos de natação...');
  for (const mod of MODULES) {
    await prisma.swimmingModule.upsert({
      where: { id: mod.id },
      update: {},
      create: { id: mod.id, name: mod.name, level: mod.level, order: mod.order, skills: JSON.stringify(mod.skills) },
    });
  }

  // Admin
  console.log('👤 Admin...');
  await prisma.user.upsert({
    where: { email: 'admin@mastchieve.com' },
    update: {},
    create: {
      email: 'admin@mastchieve.com',
      password: await hash('admin123456'),
      role: 'ADMIN',
      admin: { create: { firstName: 'Ricardo', lastName: 'Mendonça', phone: '+258 84 000 0001' } },
    },
  });

  // Instrutores
  console.log('🏊 Instrutores...');
  const instructorIds = [];
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
            firstName: inst.firstName, lastName: inst.lastName, phone: inst.phone,
            specializations: JSON.stringify(inst.specializations), bio: inst.bio,
          },
        },
      },
      include: { instructor: true },
    });
    instructorIds.push(user.instructor.id);
  }
  const [instJoao, instMaria, instPedro] = instructorIds;

  // Turmas
  console.log('📋 Turmas...');
  const classes = await Promise.all([
    prisma.class.create({ data: { name: 'Iniciantes A — Manhã', description: 'Turma de iniciação para crianças dos 6 aos 10 anos.', level: 'BEGINNER', status: 'ACTIVE', maxStudents: 8, poolLane: '1-2', schedules: JSON.stringify([{ dayOfWeek: 1, startTime: '09:30', endTime: '10:15' },{ dayOfWeek: 3, startTime: '09:30', endTime: '10:15' },{ dayOfWeek: 5, startTime: '09:30', endTime: '10:15' }]), instructorId: instJoao } }),
    prisma.class.create({ data: { name: 'Iniciantes B — Tarde', description: 'Turma de iniciação para crianças dos 8 aos 12 anos.', level: 'BEGINNER', status: 'ACTIVE', maxStudents: 8, poolLane: '3-4', schedules: JSON.stringify([{ dayOfWeek: 2, startTime: '16:00', endTime: '16:45' },{ dayOfWeek: 4, startTime: '16:00', endTime: '16:45' },{ dayOfWeek: 6, startTime: '10:00', endTime: '10:45' }]), instructorId: instPedro } }),
    prisma.class.create({ data: { name: 'Intermédio A — Tarde', description: 'Aperfeiçoamento técnico com domínio dos 4 estilos.', level: 'INTERMEDIATE', status: 'ACTIVE', maxStudents: 10, poolLane: '3-4', schedules: JSON.stringify([{ dayOfWeek: 1, startTime: '18:00', endTime: '19:00' },{ dayOfWeek: 3, startTime: '18:00', endTime: '19:00' },{ dayOfWeek: 5, startTime: '18:00', endTime: '19:00' }]), instructorId: instJoao } }),
    prisma.class.create({ data: { name: 'Avançado — Manhã', description: 'Alto rendimento técnico. Estilos avançados, viragens e saídas.', level: 'ADVANCED', status: 'ACTIVE', maxStudents: 8, poolLane: '5-6', schedules: JSON.stringify([{ dayOfWeek: 2, startTime: '07:00', endTime: '08:00' },{ dayOfWeek: 4, startTime: '07:00', endTime: '08:00' },{ dayOfWeek: 6, startTime: '08:00', endTime: '09:15' }]), instructorId: instMaria } }),
    prisma.class.create({ data: { name: 'Competição — Elite', description: 'Preparação para provas regionais e nacionais.', level: 'COMPETITIVE', status: 'ACTIVE', maxStudents: 6, poolLane: '7-8', schedules: JSON.stringify([{ dayOfWeek: 1, startTime: '06:30', endTime: '08:00' },{ dayOfWeek: 2, startTime: '18:30', endTime: '20:00' },{ dayOfWeek: 3, startTime: '06:30', endTime: '08:00' },{ dayOfWeek: 4, startTime: '18:30', endTime: '20:00' },{ dayOfWeek: 5, startTime: '06:30', endTime: '08:00' }]), instructorId: instMaria } }),
  ]);
  const [clsIniciantesA, clsIniciantesB, clsIntermedio, clsAvancado, clsCompeticao] = classes;
  const levelToClass = { BEGINNER: clsIniciantesA.id, INTERMEDIATE: clsIntermedio.id, ADVANCED: clsAvancado.id, COMPETITIVE: clsCompeticao.id };

  // Atletas
  console.log('👧 Atletas...');
  const studentIds = [];
  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i];
    const email = (s.firstName.toLowerCase() + '.' + s.lastName.toLowerCase() + '@atleta.mastchieve.com')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@.]/g, '');
    const classId = (i >= 5 && i <= 7) ? clsIniciantesB.id : (levelToClass[s.level] || clsIniciantesA.id);

    let studentUser = await prisma.user.findUnique({ where: { email }, include: { student: true } });
    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          email, password: await hash('student123'), role: 'STUDENT',
          student: { create: { firstName: s.firstName, lastName: s.lastName, dateOfBirth: new Date(s.dob), gender: s.gender, phone: s.phone || null, medicalNotes: s.medicalNotes || null, emergencyContact: s.parentName, emergencyPhone: s.parentPhone, enrollmentDate: daysAgo(randomBetween(60, 180)) } },
        },
        include: { student: true },
      });
    }
    const studentId = studentUser.student.id;
    studentIds.push(studentId);

    const parentEmail = (s.parentName.split(' ')[0].toLowerCase() + '.enc' + i + '@email.com').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@.]/g, '');
    let parentUser = await prisma.user.findUnique({ where: { email: parentEmail }, include: { parent: true } });
    if (!parentUser) {
      parentUser = await prisma.user.create({
        data: {
          email: parentEmail, password: await hash('parent123'), role: 'PARENT',
          parent: { create: { firstName: s.parentName.split(' ')[0], lastName: s.parentName.split(' ').slice(1).join(' ') || 'Enc', phone: s.parentPhone, relationship: i % 2 === 0 ? 'Pai' : 'Mãe' } },
        },
        include: { parent: true },
      });
      await prisma.studentParent.create({ data: { studentId, parentId: parentUser.parent.id, isPrimary: true } });
    }
    const existingEnrollment = await prisma.enrollment.findFirst({ where: { studentId, classId } });
    if (!existingEnrollment) {
      await prisma.enrollment.create({ data: { studentId, classId, enrolledAt: daysAgo(randomBetween(30, 150)) } });
    }
  }

  // Sessões (últimas 6 semanas)
  console.log('📅 Sessões...');
  const sessionIds = {};
  for (const cls of classes) sessionIds[cls.id] = [];
  const topics = {
    BEGINNER: ['Flutuação e respiração', 'Deslocamento aquático', 'Submersão', 'Introdução ao crol', 'Batimento de pernas'],
    ELEMENTARY: ['Técnica de crol', 'Estilo costas', 'Coordenação crol', 'Respiração lateral', 'Viragem simples'],
    INTERMEDIATE: ['Bruços', 'Séries de resistência', 'Viragem rolamento', 'Deslize e eficiência', 'Pacing'],
    ADVANCED: ['Mariposa', 'Saídas de bloco', 'Viragens avançadas', 'Séries de velocidade', 'Análise técnica'],
    COMPETITIVE: ['Alta intensidade', 'Simulação de prova', 'Pacing negativo', 'Viragens sub 0.5s', 'Preparação mental'],
  };
  for (let week = 6; week >= 0; week--) {
    for (const cls of classes) {
      const schedules = JSON.parse(cls.schedules);
      for (const sched of schedules) {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - (week * 7) + (sched.dayOfWeek - 1));
        if (sessionDate > new Date()) continue;
        const session = await prisma.classSession.create({
          data: { classId: cls.id, sessionDate, startTime: sched.startTime, endTime: sched.endTime, topic: pickRandom(topics[cls.level] || topics.BEGINNER) },
        });
        sessionIds[cls.id].push(session.id);
      }
    }
  }

  // Presenças e Avaliações
  console.log('✅ Presenças e avaliações...');
  const enrollments = await prisma.enrollment.findMany({ include: { class: true } });
  const studentClassMap = {};
  for (const e of enrollments) studentClassMap[e.studentId] = { classId: e.classId, instructorId: e.class.instructorId };

  const notes = ['Boa concentração.', 'Precisa trabalhar resistência.', 'Técnica a melhorar.', 'Excelente atitude!', 'Dificuldades nas viragens.', 'Evolução positiva.', 'Sessão produtiva.', 'Foco na postura.'];

  for (const studentId of studentIds) {
    const info = studentClassMap[studentId];
    if (!info) continue;
    const sessions = sessionIds[info.classId] || [];
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    const sData = STUDENTS.find(s => s.firstName === student.firstName && s.lastName === student.lastName);
    const level = sData ? sData.level : 'BEGINNER';
    const baseScore = { BEGINNER: 4, ELEMENTARY: 5.5, INTERMEDIATE: 6.5, ADVANCED: 7.5, COMPETITIVE: 8.5 }[level] || 5;

    for (let si = 0; si < sessions.length; si++) {
      const sessionId = sessions[si];
      const present = Math.random() < 0.90;
      const status = present ? 'PRESENT' : (Math.random() < 0.5 ? 'ABSENT' : 'JUSTIFIED');
      await prisma.attendance.upsert({
        where: { sessionId_studentId: { sessionId, studentId } },
        update: {},
        create: { sessionId, studentId, instructorId: info.instructorId, status, markedAt: new Date(Date.now() - si * 86400000) },
      });

      if (present && si % 2 === 0) {
        const prog = si * 0.04;
        const v = () => randomFloat(-1, 1);
        const technique = Math.round(Math.min(10, Math.max(1, baseScore + prog + v())));
        const stamina = Math.round(Math.min(10, Math.max(1, baseScore + prog + v())));
        const speed = Math.round(Math.min(10, Math.max(1, baseScore - 0.5 + prog + v())));
        const coordination = Math.round(Math.min(10, Math.max(1, baseScore + 0.5 + prog + v())));
        const breathing = Math.round(Math.min(10, Math.max(1, baseScore + prog + v())));
        const turns = Math.round(Math.min(10, Math.max(1, baseScore - 1 + prog + v())));
        const startDive = Math.round(Math.min(10, Math.max(1, baseScore + 0.2 + prog + v())));
        const overallScore = parseFloat(((technique + stamina + speed + coordination + breathing + turns + startDive) / 7).toFixed(1));
        const record = await prisma.performanceRecord.create({
          data: { studentId, sessionId, instructorId: info.instructorId, technique, stamina, speed, coordination, breathing, turns, startDive, overallScore, instructorNotes: pickRandom(notes), recordedAt: new Date(Date.now() - si * 86400000) },
        });
        const feedbackStatus = si === 0 ? 'PENDING' : si === 1 ? 'GENERATED' : si === 2 ? 'REVIEWED' : 'SENT';
        const feedbackText = `${student.firstName}, sessão nota ${overallScore}/10. Continua a trabalhar na técnica e resistência!`;
        await prisma.feedback.create({
          data: {
            studentId, sessionId, instructorId: info.instructorId, performanceRecordId: record.id,
            status: feedbackStatus,
            aiGeneratedText: feedbackStatus !== 'PENDING' ? feedbackText : null,
            finalText: feedbackStatus === 'SENT' ? feedbackText : null,
            aiModel: feedbackStatus !== 'PENDING' ? 'claude-sonnet-4-6' : null,
            aiTokensUsed: feedbackStatus !== 'PENDING' ? randomBetween(280, 420) : null,
            aiConfidenceScore: feedbackStatus !== 'PENDING' ? randomFloat(0.78, 0.97) : null,
            sentToStudentAt: feedbackStatus === 'SENT' ? daysAgo(si) : null,
            createdAt: daysAgo(si + 1), updatedAt: daysAgo(si),
          },
        });
      }
    }
  }

  // Progresso modular
  console.log('📈 Progresso modular...');
  const levelOrder = { BEGINNER: 1, ELEMENTARY: 2, INTERMEDIATE: 4, ADVANCED: 6, COMPETITIVE: 8 };
  for (const studentId of studentIds) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    const sData = STUDENTS.find(s => s.firstName === student.firstName && s.lastName === student.lastName);
    const maxOrder = levelOrder[sData ? sData.level : 'BEGINNER'] || 1;
    for (const mod of MODULES) {
      if (mod.order > maxOrder + 1) continue;
      let status = 'NOT_STARTED', score = null, startedAt = null, completedAt = null;
      if (mod.order < maxOrder) { status = 'COMPLETED'; score = randomFloat(6.5, 9.5); startedAt = daysAgo(randomBetween(90, 150)); completedAt = daysAgo(randomBetween(30, 89)); }
      else if (mod.order === maxOrder) { status = 'IN_PROGRESS'; score = randomFloat(4.5, 7.5); startedAt = daysAgo(randomBetween(10, 30)); }
      await prisma.progress.upsert({
        where: { studentId_moduleId: { studentId, moduleId: mod.id } },
        update: {},
        create: { studentId, moduleId: mod.id, status, score, startedAt, completedAt },
      });
    }
  }

  // Pagamentos (3 meses)
  console.log('💰 Pagamentos...');
  const now = new Date();
  const methods = ['CASH', 'MBWAY', 'BANK_TRANSFER', 'CARD'];
  for (const studentId of studentIds) {
    for (let mo = 2; mo >= 0; mo--) {
      const target = new Date(now.getFullYear(), now.getMonth() - mo, 10);
      const month = target.getMonth() + 1;
      const year = target.getFullYear();
      const fee = await prisma.monthlyFee.upsert({
        where: { studentId_month_year: { studentId, month, year } },
        update: {},
        create: { studentId, month, year, amount: 4500, dueDate: target },
      });
      const rng = Math.random();
      let status, paidAt = null;
      if (mo === 2) { status = rng < 0.95 ? 'PAID' : 'OVERDUE'; }
      else if (mo === 1) { status = rng < 0.88 ? 'PAID' : rng < 0.95 ? 'OVERDUE' : 'PENDING'; }
      else { status = rng < 0.55 ? 'PAID' : rng < 0.85 ? 'PENDING' : 'OVERDUE'; }
      if (status === 'PAID') paidAt = new Date(target.getTime() + randomBetween(-5, 10) * 86400000);
      await prisma.payment.upsert({
        where: { monthlyFeeId: fee.id },
        update: {},
        create: {
          studentId, monthlyFeeId: fee.id, amount: 4500,
          method: status === 'PAID' ? pickRandom(methods) : 'CASH',
          status, paidAt, dueDate: target,
          receiptNumber: status === 'PAID' ? `REC-${year}${String(month).padStart(2,'0')}-${studentId.slice(0,6).toUpperCase()}` : null,
          notes: status === 'OVERDUE' ? 'Pagamento em atraso' : null,
          createdAt: new Date(target.getTime() - 5 * 86400000),
        },
      });
    }
  }

  // KPI Snapshots
  console.log('📈 KPI Snapshots...');
  for (let day = 14; day >= 1; day--) {
    await prisma.kpiSnapshot.create({
      data: {
        snapshotDate: daysAgo(day),
        totalStudents: studentIds.length, activeStudents: studentIds.length - randomBetween(0, 1),
        totalInstructors: 3, totalClasses: 5,
        attendanceRate: randomFloat(87, 96), avgFeedbackScore: randomFloat(7.1, 8.4),
        npsScore: randomFloat(54, 68), instructorAdoptionRate: randomFloat(80, 95),
        overduePayments: randomBetween(1, 5),
        monthlyRevenue: parseFloat((studentIds.length * 4500 * randomFloat(0.82, 0.97)).toFixed(2)),
      },
    });
  }

  const stats = {
    students: await prisma.student.count(),
    instructors: await prisma.instructor.count(),
    classes: await prisma.class.count(),
    sessions: await prisma.classSession.count(),
    payments: await prisma.payment.count(),
  };

  console.log('\n══════════════════════════════════════════════');
  console.log('  ✅ SEED COMPLETO');
  console.log(`  👤 Atletas: ${stats.students}   🏊 Instrutores: ${stats.instructors}`);
  console.log(`  📋 Turmas: ${stats.classes}   📅 Sessões: ${stats.sessions}   💰 Pagamentos: ${stats.payments}`);
  console.log('  ──────────────────────────────────────────');
  console.log('  Admin:      admin@mastchieve.com / admin123456');
  console.log('  Instrutor:  joao.silva@mastchieve.com / instructor123');
  console.log('  Instrutor:  maria.santos@mastchieve.com / instructor123');
  console.log('  Atleta:     sofia.ferreira@atleta.mastchieve.com / student123');
  console.log('══════════════════════════════════════════════\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
