import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SENHA = 'Rh@Teste2026';
const hash = (pw: string) => bcrypt.hash(pw, 10);

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function upsertUser(email: string, role: string) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: await hash(SENHA), role, isActive: true },
  });
}

async function gerarNumeroFuncionario(seq: number) {
  return `FUNC-SEED-${String(seq).padStart(4, '0')}`;
}

async function criarFuncionario(opts: {
  seq: number;
  email: string;
  firstName: string;
  lastName: string;
  cargo: string;
  departamento?: string;
  estado?: string;
  dataAdmissao?: Date;
  salarioBase?: number;
}) {
  const existing = await prisma.user.findUnique({ where: { email: opts.email }, include: { funcionario: true } });
  if (existing?.funcionario) return existing.funcionario;

  const numeroFuncionario = await gerarNumeroFuncionario(opts.seq);
  const user = await prisma.user.create({
    data: {
      email: opts.email,
      password: await hash(SENHA),
      role: 'VISITOR',
      funcionario: {
        create: {
          numeroFuncionario,
          firstName: opts.firstName,
          lastName: opts.lastName,
          cargo: opts.cargo,
          departamento: opts.departamento || 'OPERACOES',
          dataAdmissao: opts.dataAdmissao,
          salarioBase: opts.salarioBase,
          estado: opts.estado || 'ATIVO',
        },
      },
    },
    include: { funcionario: true },
  });

  let instructorId: string | undefined;
  if (opts.cargo === 'INSTRUTOR_NATACAO') {
    const instructor = await prisma.instructor.create({
      data: {
        userId: user.id,
        firstName: opts.firstName,
        lastName: opts.lastName,
        hireDate: opts.dataAdmissao || new Date(),
        specializations: '[]',
      },
    });
    instructorId = instructor.id;
    await prisma.funcionario.update({ where: { id: user.funcionario!.id }, data: { instructorId } });
  }

  return prisma.funcionario.findUniqueOrThrow({ where: { id: user.funcionario!.id } });
}

async function main() {
  console.log('=== Seed RH — a criar utilizadores e dados de teste ===');

  const gestor = await upsertUser('gestorrh@mastchieve.co.mz', 'GESTOR_RH');
  const superAdmin = await upsertUser('superadmin@mastchieve.co.mz', 'SUPER_ADMIN');
  console.log(`Gestor RH:   ${gestor.email} / ${SENHA}`);
  console.log(`Super Admin: ${superAdmin.email} / ${SENHA}`);

  const jaSeedado = await prisma.funcionario.findFirst({ where: { numeroFuncionario: 'FUNC-SEED-0001' } });
  if (jaSeedado) {
    console.log('\nOs dados de teste do RH já existem (funcionário FUNC-SEED-0001 encontrado) — nada a fazer.');
    console.log('Para recriar do zero, apaga primeiro os registos com numeroFuncionario a começar por "FUNC-SEED-" e volta a correr este script.');
    return;
  }

  // ── Funcionários ────────────────────────────────────────────────────────
  const ana = await criarFuncionario({
    seq: 1, email: 'ana.instrutora@mastchieve.co.mz', firstName: 'Ana', lastName: 'Nadadora',
    cargo: 'INSTRUTOR_NATACAO', departamento: 'OPERACOES', estado: 'ATIVO',
    dataAdmissao: addDays(-400), salarioBase: 45000,
  });
  const bruno = await criarFuncionario({
    seq: 2, email: 'bruno.salvavidas@mastchieve.co.mz', firstName: 'Bruno', lastName: 'Costa',
    cargo: 'SALVA_VIDAS', departamento: 'OPERACOES', estado: 'ATIVO',
    dataAdmissao: addDays(-200), salarioBase: 32000,
  });
  const carla = await criarFuncionario({
    seq: 3, email: 'carla.recepcao@mastchieve.co.mz', firstName: 'Carla', lastName: 'Mendes',
    cargo: 'RECEPCIONISTA', departamento: 'ADMINISTRATIVO', estado: 'ATIVO',
    dataAdmissao: addDays(-90), salarioBase: 28000,
  });
  const duarte = await criarFuncionario({
    seq: 4, email: 'duarte.coordenador@mastchieve.co.mz', firstName: 'Duarte', lastName: 'Silva',
    cargo: 'COORDENADOR', departamento: 'OPERACOES', estado: 'EM_ADMISSAO',
    dataAdmissao: addDays(-5), salarioBase: 50000,
  });
  const emanuel = await criarFuncionario({
    seq: 5, email: 'emanuel.instrutor.bloqueado@mastchieve.co.mz', firstName: 'Emanuel', lastName: 'Rocha',
    cargo: 'INSTRUTOR_NATACAO', departamento: 'OPERACOES', estado: 'ATIVO',
    dataAdmissao: addDays(-600), salarioBase: 42000,
  });
  console.log('Funcionários criados: Ana, Bruno, Carla, Duarte, Emanuel');

  // ── Certificações (para testar bloqueio no ClassesModule) ─────────────────
  await prisma.certificacaoFuncionario.createMany({
    data: [
      { funcionarioId: ana.id, tipo: 'INSTRUTOR_NATACAO', entidadeEmissora: 'Federação Moçambicana de Natação', dataEmissao: addDays(-300), dataValidade: addDays(180), estado: 'ATIVA' },
      { funcionarioId: ana.id, tipo: 'NADADOR_SALVADOR', entidadeEmissora: 'Cruz Vermelha', dataEmissao: addDays(-350), dataValidade: addDays(12), estado: 'ATIVA' }, // a expirar em breve — testa alerta do scheduler
      { funcionarioId: bruno.id, tipo: 'NADADOR_SALVADOR', entidadeEmissora: 'Cruz Vermelha', dataEmissao: addDays(-400), dataValidade: addDays(-5), estado: 'ATIVA' }, // já expirada
      { funcionarioId: bruno.id, tipo: 'PRIMEIROS_SOCORROS', entidadeEmissora: 'Cruz Vermelha', dataEmissao: addDays(-100), dataValidade: addDays(265), estado: 'ATIVA' },
      { funcionarioId: emanuel.id, tipo: 'INSTRUTOR_NATACAO', entidadeEmissora: 'Federação Moçambicana de Natação', dataEmissao: addDays(-500), dataValidade: addDays(400), estado: 'REVOGADA' }, // revogada — bloqueia atribuição a turmas
    ],
  });
  console.log('Certificações criadas (Ana OK / a expirar em 12 dias; Bruno expirada; Emanuel REVOGADA — bloqueia turmas)');

  // ── Vagas + Candidaturas ───────────────────────────────────────────────────
  const vagaRascunho = await prisma.vaga.create({
    data: { titulo: 'Instrutor de Natação — Estágio Manhã', cargo: 'INSTRUTOR_NATACAO', descricao: 'Vaga para estágio de instrutor no turno da manhã.', numeroVagas: 1, orcamentoEstimado: 20000, estado: 'RASCUNHO', solicitanteId: gestor.id },
  });
  const vagaEmAprovacao = await prisma.vaga.create({
    data: { titulo: 'Salva-vidas Fim de Semana', cargo: 'SALVA_VIDAS', descricao: 'Reforço de equipa de salva-vidas para os fins de semana.', numeroVagas: 2, orcamentoEstimado: 30000, estado: 'EM_APROVACAO', solicitanteId: gestor.id },
  });
  const vagaPublicada = await prisma.vaga.create({
    data: { titulo: 'Recepcionista Part-time', cargo: 'RECEPCIONISTA', descricao: 'Atendimento ao público em regime part-time.', numeroVagas: 1, orcamentoEstimado: 15000, estado: 'PUBLICADA', solicitanteId: gestor.id, aprovadoPorId: superAdmin.id, aprovadoEm: addDays(-10), publicadaEm: addDays(-9) },
  });
  await prisma.candidatura.createMany({
    data: [
      { vagaId: vagaPublicada.id, nomeCandidato: 'Sofia Nhantumbo', email: 'sofia.n@example.com', telefone: '+258 84 111 2222', estado: 'RECEBIDA' },
      { vagaId: vagaPublicada.id, nomeCandidato: 'Ricardo Macuácua', email: 'ricardo.m@example.com', telefone: '+258 84 333 4444', estado: 'ENTREVISTADO', notaEntrevista: 7.5, avaliadoPorId: gestor.id },
      { vagaId: vagaPublicada.id, nomeCandidato: 'Helena Chissano', email: 'helena.c@example.com', telefone: '+258 84 555 6666', estado: 'APROVADA_RH', notaEntrevista: 9, notaTestePratico: 8.5, avaliadoPorId: gestor.id }, // pronta para aprovarFinal (Super Admin)
    ],
  });
  console.log('Vagas criadas (RASCUNHO / EM_APROVACAO / PUBLICADA com 3 candidaturas)');

  // ── Contratos ────────────────────────────────────────────────────────────
  await prisma.contrato.create({
    data: { funcionarioId: ana.id, tipo: 'EFETIVO', cargo: 'INSTRUTOR_NATACAO', salarioBase: 45000, dataInicio: addDays(-400), estado: 'ATIVO', elaboradoPorId: gestor.id, assinadoPorId: superAdmin.id, assinadoEm: addDays(-398) },
  });
  await prisma.contrato.create({
    data: { funcionarioId: bruno.id, tipo: 'TERMO_CERTO', cargo: 'SALVA_VIDAS', salarioBase: 32000, dataInicio: addDays(2), dataFim: addDays(367), estado: 'AGUARDA_ASSINATURA', elaboradoPorId: gestor.id }, // pronto para testar assinar()
  });
  console.log('Contratos criados (Ana ATIVO / Bruno AGUARDA_ASSINATURA)');

  // ── Escalas ──────────────────────────────────────────────────────────────
  await prisma.escala.createMany({
    data: [
      { funcionarioId: ana.id, data: addDays(1), turno: 'MANHA', horaInicio: '08:00', horaFim: '12:00', tipo: 'AULA', estado: 'PLANEADA' },
      { funcionarioId: ana.id, data: addDays(3), turno: 'TARDE', horaInicio: '14:00', horaFim: '18:00', tipo: 'AULA', estado: 'PLANEADA' },
      { funcionarioId: bruno.id, data: addDays(1), turno: 'MANHA', horaInicio: '07:00', horaFim: '13:00', tipo: 'SALVAMENTO', estado: 'PLANEADA' },
    ],
  });
  console.log('Escalas futuras criadas para Ana e Bruno');

  // ── Avaliações de desempenho ────────────────────────────────────────────
  await prisma.avaliacaoDesempenho.create({
    data: { funcionarioId: ana.id, avaliadorId: gestor.id, periodo: '2026-S1', pontualidade: 5, competenciaTecnica: 5, trabalhoEquipa: 4, atendimento: 5, pontuacaoGeral: 4.75, estado: 'REALIZADA' },
  });
  await prisma.avaliacaoDesempenho.create({
    data: { funcionarioId: bruno.id, avaliadorId: gestor.id, periodo: '2026-S1', dataLimite: addDays(15), estado: 'PENDENTE' }, // por realizar
  });
  console.log('Avaliações de desempenho criadas (Ana REALIZADA / Bruno PENDENTE)');

  // ── Férias / Faltas ──────────────────────────────────────────────────────
  await prisma.feriasFalta.create({
    data: { funcionarioId: carla.id, tipo: 'FERIAS', dataInicio: addDays(20), dataFim: addDays(30), diasSolicitados: 10, estado: 'PENDENTE', solicitanteId: gestor.id },
  });
  await prisma.feriasFalta.create({
    data: { funcionarioId: bruno.id, tipo: 'LICENCA_MEDICA', dataInicio: addDays(1), dataFim: addDays(15), diasSolicitados: 14, excepcional: true, estado: 'ENCAMINHADA_SUPER_ADMIN', solicitanteId: gestor.id }, // exige aprovação do Super Admin
  });
  console.log('Férias/Faltas criadas (Carla PENDENTE / Bruno excecional ENCAMINHADA_SUPER_ADMIN)');

  // ── Folha de pagamento ───────────────────────────────────────────────────
  const hoje = new Date();
  await prisma.folhaPagamento.create({
    data: { funcionarioId: ana.id, mes: hoje.getMonth() + 1, ano: hoje.getFullYear(), salarioBase: 45000, premios: 2000, descontos: 500, valorLiquido: 46500, estado: 'PENDENTE_APROVACAO', processadoPorId: gestor.id },
  });
  const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  await prisma.folhaPagamento.create({
    data: { funcionarioId: bruno.id, mes: mesPassado.getMonth() + 1, ano: mesPassado.getFullYear(), salarioBase: 32000, valorLiquido: 32000, estado: 'PAGA', processadoPorId: gestor.id, aprovadoPorId: superAdmin.id, aprovadoEm: addDays(-20), pagoEm: addDays(-18) },
  });
  console.log('Folha de pagamento criada (Ana mês atual PENDENTE_APROVACAO / Bruno mês anterior PAGA)');

  // ── Disciplina ───────────────────────────────────────────────────────────
  await prisma.ocorrenciaDisciplinar.create({
    data: { funcionarioId: carla.id, tipo: 'ATRASO', gravidade: 'LEVE', descricao: 'Chegada com 20 minutos de atraso sem justificação.', estado: 'REGISTADA', registadoPorId: gestor.id },
  });
  await prisma.ocorrenciaDisciplinar.create({
    data: { funcionarioId: bruno.id, tipo: 'VIOLACAO_SEGURANCA', gravidade: 'GRAVE', descricao: 'Abandonou o posto de vigilância durante o horário de funcionamento da piscina.', estado: 'ESCALADA_SUPER_ADMIN', registadoPorId: gestor.id }, // exige decisão do Super Admin
  });
  console.log('Ocorrências disciplinares criadas (Carla LEVE / Bruno GRAVE ESCALADA_SUPER_ADMIN)');

  // ── Formação ─────────────────────────────────────────────────────────────
  const formacaoProposta = await prisma.formacao.create({
    data: { titulo: 'Reciclagem de Primeiros Socorros', tipo: 'RECICLAGEM', custoEstimado: 8000, estado: 'PROPOSTA', propostoPorId: gestor.id }, // pronta para aprovarOrcamento
  });
  const formacaoEmCurso = await prisma.formacao.create({
    data: { titulo: 'Curso de Salvamento Aquático Avançado', tipo: 'CERTIFICACAO', custoEstimado: 15000, estado: 'APROVADA_ORCAMENTO', propostoPorId: gestor.id, aprovadoPorId: superAdmin.id, aprovadoEm: addDays(-5) },
  });
  await prisma.funcionarioFormacao.create({
    data: { formacaoId: formacaoEmCurso.id, funcionarioId: ana.id, estado: 'INSCRITO' }, // pronto para concluirParticipante
  });
  console.log('Formações criadas (Reciclagem PROPOSTA / Salvamento Avançado APROVADA_ORCAMENTO com Ana inscrita)');

  // ── Desligamento (processo pendente, para testar aprovar/rejeitar) ────────
  await prisma.desligamento.create({
    data: { funcionarioId: duarte.id, tipo: 'FIM_CONTRATO', avisoPrevioDias: 30, estado: 'AGUARDA_APROVACAO', iniciadoPorId: gestor.id },
  });
  console.log('Desligamento AGUARDA_APROVACAO criado para Duarte (testa aprovar/rejeitar como Super Admin)');

  console.log('\n=== Seed RH concluído ===');
  console.log(`Login Gestor RH:   gestorrh@mastchieve.co.mz   / ${SENHA}`);
  console.log(`Login Super Admin: superadmin@mastchieve.co.mz / ${SENHA}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
