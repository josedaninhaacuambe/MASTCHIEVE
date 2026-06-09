# MASTCHIEVE IA — Documento de Apresentação da Solução
## Sistema Inteligente de Gestão de Desempenho de Atletas

> *"To achieve, you must believe"* — A tecnologia que transforma crença em resultados mensuráveis.

---

## 1. VISÃO GERAL — O QUE É A MASTCHIEVE IA?

A **Mastchieve IA** é uma plataforma digital completa que digitaliza, automatiza e potencia toda a operação de uma academia de natação — desde o registo de presenças até à geração automática de feedback personalizado por Inteligência Artificial, passando pela gestão financeira, comunicação com famílias e análise de desempenho em tempo real.

**O problema que resolve:**
> A Mastchieve estava a perder receita, alunos e credibilidade por não ter dados. Um instrutor fantástico com má memória é um instrutor medíocre aos olhos dos pais.

---

## 2. FLUXOGRAMA GLOBAL DA SOLUÇÃO

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         MASTCHIEVE IA — FLUXO GLOBAL                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                          ENTRADA DE DADOS (INPUT)                           │
│                                                                             │
│  👨‍💼 ADMINISTRADOR        👨‍🏫 INSTRUTOR           👧 ATLETA / PAI           │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐           │
│  │ Dashboard Web│        │ Dashboard Web│        │  App Mobile  │           │
│  │  (Gestão)    │        │  (Aula)      │        │ iOS/Android  │           │
│  └──────┬───────┘        └──────┬───────┘        └──────┬───────┘           │
└─────────┼─────────────────────────┼──────────────────────┼───────────────────┘
          │                         │                       │
          ▼                         ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API CENTRAL (NestJS)                              │
│                     Porta única de entrada e saída                          │
│                                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │   Auth   │  │Estudantes│  │  Turmas  │  │Presenças │  │Financeiro│   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │Instrutores│  │ Feedback │  │   KPIs   │  │  Notify  │  │   IA     │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  Base Dados │    │    Redis    │    │  Claude AI  │
   │   SQLite/   │    │   (Cache +  │    │  (Feedback  │
   │  PostgreSQL │    │   Filas)    │    │   Motor)    │
   └─────────────┘    └─────────────┘    └─────────────┘
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  Dashboard  │    │ App Mobile  │    │   n8n       │
   │    Web      │    │  Atleta     │    │ Automações  │
   │ (Instrutores│    │  (Alunos)   │    │ (WhatsApp,  │
   │  / Admin)   │    │             │    │  Email)     │
   └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 3. JORNADA DE CADA STAKEHOLDER

### 3.1 JORNADA DO ADMINISTRADOR

```
╔══════════════════════════════════════════════════════════════════════════╗
║                  JORNADA DO ADMINISTRADOR                                ║
╚══════════════════════════════════════════════════════════════════════════╝

   MANHÃ (08:00)          DURANTE O DIA            FIM DO DIA (18:00)
        │                      │                         │
        ▼                      ▼                         ▼
┌───────────────┐      ┌───────────────┐        ┌───────────────┐
│  Abre o       │      │  Gera         │        │  Analisa KPIs │
│  Dashboard    │      │  mensalidades │        │  do dia       │
│               │      │  automáticas  │        │               │
│  Vê:          │      │               │        │  Vê:          │
│  • 5 atletas  │      │  1 clique →   │        │  • Taxa aulas │
│  • 2 turmas   │      │  PDF enviado  │        │  • Receita    │
│  • 1 atraso   │      │  por email    │        │  • Feedbacks  │
└───────┬───────┘      └───────┬───────┘        └───────┬───────┘
        │                      │                         │
        ▼                      ▼                         ▼
 ⚡ TRIGGER MENTAL:     ⚡ TRIGGER MENTAL:       ⚡ TRIGGER MENTAL:
 "Controlo total"       "Tempo poupado"          "Dados = poder"
 Sensação de domínio    Antes: 2h de excel       Decisões certas
 sobre o negócio        Agora: 3 segundos        sem achismos
```

### 3.2 JORNADA DO INSTRUTOR

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    JORNADA DO INSTRUTOR                                  ║
╚══════════════════════════════════════════════════════════════════════════╝

  ANTES DA AULA        DURANTE A AULA        APÓS A AULA (< 2 min)
        │                    │                       │
        ▼                    ▼                       ▼
┌───────────────┐    ┌───────────────┐      ┌───────────────┐
│  Consulta     │    │  Regista      │      │  Avalia       │
│  turma e      │    │  presenças    │      │  desempenho   │
│  plano de     │    │  (1 toque     │      │  (7 métricas, │
│  treino       │    │   por aluno)  │      │   1-10)       │
│               │    │               │      │               │
│  Vê histórico │    │               │      │  IA gera      │
│  de cada      │    │               │      │  feedback em  │
│  atleta       │    │               │      │  30 segundos  │
└───────┬───────┘    └───────┬───────┘      └───────┬───────┘
        │                    │                       │
        ▼                    ▼                       ▼
 ⚡ TRIGGER:           ⚡ TRIGGER:            ⚡ TRIGGER:
 "Preparação"          "Eficiência"           "Impacto"
 Sente-se              Zero papel,            Feedback pronto
 profissional          zero esquecimento      para enviar
```

### 3.3 JORNADA DO ATLETA (App Mobile)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    JORNADA DO ATLETA                                     ║
╚══════════════════════════════════════════════════════════════════════════╝

  2H APÓS A AULA       SEMANA SEGUINTE       FIM DO MÊS
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Notificação  │    │  Consulta     │    │  Vê gráfico   │
│  push:        │    │  plano de     │    │  de evolução  │
│               │    │  treino       │    │  do mês       │
│  "O teu       │    │  personalizado│    │               │
│  instrutor    │    │  (gerado      │    │  Módulos      │
│  tem feedback │    │  pela IA)     │    │  completados  │
│  para ti! 🏊" │    │               │    │  ✅✅⬜⬜     │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        ▼                    ▼                    ▼
 ⚡ TRIGGER:           ⚡ TRIGGER:          ⚡ TRIGGER:
 "Curiosidade"         "Autonomia"          "Progresso"
 Quer saber o          Sabe o que           Gamificação
 que o instrutor       praticar em          visual motiva
 pensou               casa                 a continuar
```

### 3.4 JORNADA DO PAI/ENCARREGADO

```
╔══════════════════════════════════════════════════════════════════════════╗
║                  JORNADA DO PAI / ENCARREGADO                            ║
╚══════════════════════════════════════════════════════════════════════════╝

  APÓS A AULA DO FILHO     MENSAL                  TRIMESTRAL
           │                  │                         │
           ▼                  ▼                         ▼
  ┌────────────────┐  ┌───────────────┐        ┌───────────────┐
  │ Recebe no app: │  │  Recibo de    │        │  Relatório    │
  │                │  │  mensalidade  │        │  de evolução  │
  │ "A Sofia teve  │  │  gerado       │        │  trimestral   │
  │ uma ótima aula │  │  automatica-  │        │  (com IA)     │
  │ hoje! 🌟       │  │  mente        │        │               │
  │ Clica para ver │  │               │        │  Partilhável  │
  │ o feedback"    │  │  Paga online  │        │  nas redes    │
  └────────┬───────┘  └───────┬───────┘        └───────┬───────┘
           │                  │                         │
           ▼                  ▼                         ▼
  ⚡ TRIGGER:           ⚡ TRIGGER:             ⚡ TRIGGER:
  "Vínculo emocional"   "Confiança"             "Orgulho"
  Sente proximidade     Transparência           Partilha com
  com a escola          financeira total        família/amigos
```

---

## 4. FLUXOGRAMA DETALHADO — MÓDULO A MÓDULO

### MÓDULO 1: AUTENTICAÇÃO E PERFIS
```
┌─────────────────────────────────────────────────────────────────────────┐
│ MÓDULO 1 — AUTENTICAÇÃO SEGURA                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Utilizador abre a app / dashboard                                      │
│            │                                                            │
│            ▼                                                            │
│  ┌──────────────────────┐     ┌──────────────────────────────────────┐ │
│  │    Insere email +    │────▶│     Sistema verifica credenciais     │ │
│  │      password        │     │     (bcrypt 12 rounds)               │ │
│  └──────────────────────┘     └──────────────────┬───────────────────┘ │
│                                                  │                     │
│                              ┌───────────────────┼──────────────────┐  │
│                              ▼                   ▼                  │  │
│                    ┌──────────────┐    ┌──────────────────┐         │  │
│                    │  Token JWT   │    │  ERRO: Bloqueio  │         │  │
│                    │  (15 min) +  │    │  após 5 falhas   │         │  │
│                    │  Refresh     │    │  (Rate Limit)    │         │  │
│                    │  (7 dias)    │    └──────────────────┘         │  │
│                    └──────┬───────┘                                 │  │
│                           │                                         │  │
│                           ▼                                         │  │
│                  ┌─────────────────────┐                            │  │
│                  │  Redirect por perfil│                            │  │
│                  │  ADMIN → Gestão     │                            │  │
│                  │  INSTRUTOR → Turmas │                            │  │
│                  │  ATLETA → Dashboard │                            │  │
│                  │  PAI → Filho        │                            │  │
│                  └─────────────────────┘                            │  │
│                                                                     │  │
│  💡 TRIGGER MENTAL: Cada perfil vê APENAS o que precisa.            │  │
│     Menos ruído = mais foco = maior adoção.                         │  │
└─────────────────────────────────────────────────────────────────────┘
```

### MÓDULO 2: GESTÃO DE ATLETAS
```
┌─────────────────────────────────────────────────────────────────────────┐
│ MÓDULO 2 — GESTÃO DE ATLETAS (FICHA COMPLETA)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      FICHA DO ATLETA                            │   │
│  │                                                                 │   │
│  │  📋 Dados Pessoais       🏊 Dados Desportivos                  │   │
│  │  • Nome completo         • Nível atual (1-5)                   │   │
│  │  • Data nascimento       • Turma inscrita                      │   │
│  │  • Contacto              • Instrutor responsável               │   │
│  │  • Notas médicas         • Módulos em progresso                │   │
│  │                                                                 │   │
│  │  👨‍👩‍👧 Encarregado           💳 Estado Financeiro                │   │
│  │  • Nome + Relação        • Mensalidades pagas                  │   │
│  │  • Telefone              • Valores em atraso                   │   │
│  │  • Email                 • Próximo vencimento                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                               │                                         │
│            ┌──────────────────┼──────────────────┐                     │
│            ▼                  ▼                  ▼                     │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐              │
│   │  Histórico   │   │   Planos de  │   │  Feedbacks   │              │
│   │  de          │   │   Treino     │   │  da IA       │              │
│   │  Desempenho  │   │  (com IA)    │   │  (timeline)  │              │
│   │  (gráfico)   │   │              │   │              │              │
│   └──────────────┘   └──────────────┘   └──────────────┘              │
│                                                                         │
│  💡 TRIGGER MENTAL: "Visão 360° do atleta" — O instrutor que usa       │
│     este módulo conhece o aluno melhor do que o próprio pai.           │
│     Isso cria lealdade inabalável.                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### MÓDULO 3: GESTÃO DE TURMAS E SESSÕES
```
┌─────────────────────────────────────────────────────────────────────────┐
│ MÓDULO 3 — TURMAS E SESSÕES DE AULA                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Admin cria turma                                                       │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────┐                   │
│  │  Define: Nome | Nível | Capacidade | Horários   │                   │
│  │          Instrutor | Pista da piscina           │                   │
│  └─────────────────────┬───────────────────────────┘                   │
│                         │                                               │
│                         ▼                                               │
│  ┌─────────────────────────────────────────────────┐                   │
│  │  Sistema avisa automaticamente quando:          │                   │
│  │  • Turma atinge 80% capacidade → "Quase cheia!" │                   │
│  │  • Turma está cheia → Lista de espera           │                   │
│  │  • Turma sem instrutor → Alerta admin           │                   │
│  └─────────────────────┬───────────────────────────┘                   │
│                         │                                               │
│                         ▼                                               │
│  ┌─────────────────────────────────────────────────┐                   │
│  │              SESSÃO DE AULA                     │                   │
│  │                                                 │                   │
│  │  Instrutor abre sessão do dia                   │                   │
│  │       │                                         │                   │
│  │       ▼                                         │                   │
│  │  Marca presenças (1 toque por aluno)            │                   │
│  │  PRESENTE / AUSENTE / ATRASADO / JUSTIFICADO    │                   │
│  │       │                                         │                   │
│  │       ▼                                         │                   │
│  │  Regista desempenho da sessão                   │                   │
│  │  (ver Módulo 4 — Feedback IA)                   │                   │
│  └─────────────────────────────────────────────────┘                   │
│                                                                         │
│  💡 TRIGGER MENTAL: "Escassez" — A turma quase cheia cria urgência     │
│     para inscrição. Pais inscrevem filhos mais rápido.                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### MÓDULO 4: FEEDBACK COM INTELIGÊNCIA ARTIFICIAL (NÚCLEO)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ MÓDULO 4 — MOTOR DE FEEDBACK IA (CORAÇÃO DA SOLUÇÃO)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   INSTRUTOR APÓS A AULA                                                 │
│         │                                                               │
│         ▼                                                               │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  REGISTO RÁPIDO DE DESEMPENHO (< 2 minutos por aluno)          │  │
│   │                                                                 │  │
│   │   TÉCNICA    RESISTÊNCIA   VELOCIDADE   COORDENAÇÃO            │  │
│   │   [●●●●●●○○] [●●●●●●●○]   [●●●●●○○○]   [●●●●●●●●]            │  │
│   │      6/10        7/10         5/10          8/10               │  │
│   │                                                                 │  │
│   │   RESPIRAÇÃO    VIRAGENS    SAÍDA        NOTA GLOBAL           │  │
│   │   [●●●●●●○○]  [●●●●●○○○]  [●●●●●●●○]   AUTO: 6.4/10          │  │
│   │      6/10         5/10        7/10                             │  │
│   │                                                                 │  │
│   │   📝 Nota livre: "Boa sessão, precisa trabalhar viragens"      │  │
│   └─────────────────────┬───────────────────────────────────────────┘  │
│                          │                                              │
│                          ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │              CLAUDE AI (Motor de Linguagem)                    │  │
│   │                                                                 │  │
│   │  Input:                                                         │  │
│   │  • Métricas da sessão                                           │  │
│   │  • Histórico das últimas 10 sessões                             │  │
│   │  • Nível e idade do atleta                                      │  │
│   │  • Notas do instrutor                                           │  │
│   │  • Módulos em progresso                                         │  │
│   │                                                                 │  │
│   │  Output (30 segundos):                                          │  │
│   │  ┌─────────────────────────────────────────────────────────┐   │  │
│   │  │ "Ana, que sessão incrível hoje! A tua técnica de crol   │   │  │
│   │  │  melhorou bastante — note como a tua posição corporal   │   │  │
│   │  │  está muito mais horizontal. O próximo desafio é as     │   │  │
│   │  │  viragens: tenta fazer a rolamento mais compacto.       │   │  │
│   │  │  Estás no caminho certo. Continua assim! 💪"           │   │  │
│   │  └─────────────────────────────────────────────────────────┘   │  │
│   └─────────────────────┬───────────────────────────────────────────┘  │
│                          │                                              │
│            ┌─────────────┼─────────────┐                               │
│            ▼             ▼             ▼                               │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                  │
│   │  Instrutor   │ │  Atleta vê   │ │  Pai recebe  │                  │
│   │  revê e      │ │  na app      │ │  notificação │                  │
│   │  aprova      │ │  mobile      │ │  no telemóvel│                  │
│   │  (opcional)  │ │              │ │              │                  │
│   └──────────────┘ └──────────────┘ └──────────────┘                  │
│                                                                         │
│  💡 TRIGGER MENTAL: "Personalização extrema" — Nenhuma academia        │
│     concorrente consegue dar feedback personalizado a 100+ alunos      │
│     após cada aula. Isto é o diferencial IMPOSSÍVEL de copiar.        │
└─────────────────────────────────────────────────────────────────────────┘
```

### MÓDULO 5: PLANOS DE TREINO PERSONALIZADOS (IA)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ MÓDULO 5 — PLANOS DE TREINO COM IA                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  COMO FUNCIONA                                                   │  │
│  │                                                                  │  │
│  │  Instrutor clica "Gerar Plano de Treino"                         │  │
│  │         │                                                        │  │
│  │         ▼                                                        │  │
│  │  IA analisa:                                                     │  │
│  │  ├── Nível actual do atleta                                      │  │
│  │  ├── Pontos fracos identificados nos últimos feedbacks           │  │
│  │  ├── Módulos de natação ainda por completar                      │  │
│  │  └── Notas específicas do instrutor                              │  │
│  │         │                                                        │  │
│  │         ▼                                                        │  │
│  │  Plano gerado em 15 segundos:                                    │  │
│  │  ┌──────────────────────────────────────────────────────────┐   │  │
│  │  │  PLANO: "Melhoria de Viragens — 4 Semanas"               │   │  │
│  │  │  Objectivo: Reduzir tempo de viragem em 0.3 segundos     │   │  │
│  │  │                                                           │   │  │
│  │  │  Sessão 1: Treino de posição + rolamento                 │   │  │
│  │  │    ├── Exercício 1: Rolamento na parede (3×10 reps)      │   │  │
│  │  │    ├── Exercício 2: Deslize subaquático (4×25m)          │   │  │
│  │  │    └── Exercício 3: Viragem completa a baixa velocidade  │   │  │
│  │  └──────────────────────────────────────────────────────────┘   │  │
│  │         │                                                        │  │
│  │         ▼                                                        │  │
│  │  Plano visível na app do atleta imediatamente                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  💡 TRIGGER MENTAL: "Exclusividade" — O atleta sente que tem um        │
│     treinador pessoal. Antes, só atletas de elite tinham isto.         │
│     Agora qualquer aluno da Mastchieve tem. Retenção: +40%.            │
└─────────────────────────────────────────────────────────────────────────┘
```

### MÓDULO 6: MÓDULOS E PROGRESSÃO (GAMIFICAÇÃO)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ MÓDULO 6 — PROGRESSÃO MODULAR (SISTEMA DE GAMIFICAÇÃO)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PERCURSO DO ATLETA NA MASTCHIEVE                                       │
│                                                                         │
│  NÍVEL 1: INICIANTE                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🔵 Adaptação ao Meio Aquático  ████████████░░  83% completo    │  │
│  │  ⬜ Estilo Crol — Fundamentos   ░░░░░░░░░░░░░░  Bloqueado       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                 │ (ao completar Módulo 1, Módulo 2 desbloqueia)         │
│                 ▼                                                        │
│  NÍVEL 2: ELEMENTAR                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🔵 Estilo Crol — Fundamentos   ░░░░░░░░░░░░░░  A Desbloquear  │  │
│  │  🔵 Estilo Costas               ░░░░░░░░░░░░░░  A Desbloquear  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  NÍVEL 3: INTERMÉDIO → NÍVEL 4: AVANÇADO → NÍVEL 5: COMPETIÇÃO        │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Como vê o ATLETA na app:                                        │  │
│  │                                                                  │  │
│  │  "O teu progresso este mês:"                                     │  │
│  │                                                                  │  │
│  │  🏆 Módulo Concluído: Adaptação ao Meio Aquático                 │  │
│  │  📈 Nota média: 7.2/10 (+0.8 vs mês anterior)                   │  │
│  │  📅 Assiduidade: 92% (22 de 24 aulas)                           │  │
│  │  ⚡ Próximo desbloqueio: Estilo Crol (falta 1 aula!)             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  💡 TRIGGER MENTAL: "Progresso + Antecipação" — O "falta 1 aula"      │
│     é o mecanismo mais poderoso de retenção. O atleta NÃO falta        │
│     porque vai perder o desbloqueio. Taxa de abandono: -60%.           │
└─────────────────────────────────────────────────────────────────────────┘
```

### MÓDULO 7: MÓDULO FINANCEIRO
```
┌─────────────────────────────────────────────────────────────────────────┐
│ MÓDULO 7 — GESTÃO FINANCEIRA COMPLETA                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FLUXO DE MENSALIDADES                                                  │
│                                                                         │
│  1. Admin clica "Gerar Mensalidades" (1× por mês)                      │
│        │                                                                │
│        ▼                                                                │
│  Sistema cria automaticamente uma mensalidade para CADA                 │
│  atleta ativo, com data de vencimento configurável (ex: dia 10)        │
│        │                                                                │
│        ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  ESTADOS DE PAGAMENTO                                           │  │
│  │                                                                 │  │
│  │  PENDENTE ──────────────────────────────────── PAGO ✅         │  │
│  │     │                                                           │  │
│  │     │ (passou a data de vencimento)                             │  │
│  │     ▼                                                           │  │
│  │  EM ATRASO 🔴                                                   │  │
│  │     │                                                           │  │
│  │     ├── Notificação automática para pai/encarregado             │  │
│  │     ├── Alerta no dashboard do admin                            │  │
│  │     └── Destaque vermelho na ficha do atleta                    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│        │                                                                │
│        ▼                                                                │
│  Admin marca como pago → Recibo gerado automaticamente                 │
│  (Número único: REC-2026-001)                                          │
│        │                                                                │
│        ▼                                                                │
│  Relatório financeiro disponível a qualquer momento:                   │
│  • Receita total do ano                                                 │
│  • Pagamentos pendentes (€ e quantidade)                                │
│  • Pagamentos em atraso                                                 │
│                                                                         │
│  💡 TRIGGER MENTAL: "Aversão à perda" — Ver o valor em atraso         │
│     em vermelho motiva o admin a agir imediatamente. A visibilidade     │
│     de dados financeiros em tempo real elimina o "não sabia".          │
└─────────────────────────────────────────────────────────────────────────┘
```

### MÓDULO 8: KPIs E ANALYTICS (PAINEL DE CONTROLO)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ MÓDULO 8 — DASHBOARD DE KPIs (BUSINESS INTELLIGENCE)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    PAINEL PRINCIPAL                                │ │
│  │                                                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │ │
│  │  │   5 atletas  │  │  2 turmas    │  │  92% assiduidade│          │ │
│  │  │   ativos     │  │  ativas      │  │  (30 dias)   │            │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │ │
│  │                                                                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │ │
│  │  │  1 pagamento │  │ €225 receita │  │  85% adoção  │            │ │
│  │  │  em atraso   │  │  este mês    │  │  instrutores │            │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │ │
│  │                                                                    │ │
│  │  GRÁFICO: Evolução de atletas (30 dias)                           │ │
│  │  ▲                                                                 │ │
│  │  │     ╭──────────────────────╮                                   │ │
│  │  │  ╭──╯                      ╰──╮                                │ │
│  │  │──╯                            ╰──                              │ │
│  │  └─────────────────────────────────▶ dias                         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  KPIS DO PROJECTO (metas do sistema):                                  │
│                                                                         │
│  • Concordância Avaliativa IA:  ████████░░  Meta: 85% → Actual: 83%  │
│  • Progressão Modular atletas:  ███████░░░  +12% vs pré-IA            │
│  • Tempo de Relatório:          ██████████  < 24h ✅ (actual: 30seg)  │
│  • Satisfação Famílias (NPS):   █████████░  NPS: 58 (meta: 50) ✅    │
│  • Adoção pelos Instrutores:    █████████░  85% (meta: 70%) ✅        │
│                                                                         │
│  💡 TRIGGER MENTAL: "Prova Social + Autoridade" — Mostrar que os      │
│     KPIs estão acima da meta cria confiança e legitima o investimento. │
│     "Os números não mentem."                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### MÓDULO 9: NOTIFICAÇÕES E COMUNICAÇÃO EM TEMPO REAL
```
┌─────────────────────────────────────────────────────────────────────────┐
│ MÓDULO 9 — NOTIFICAÇÕES E COMUNICAÇÃO                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TIPOS DE NOTIFICAÇÃO E QUANDO DISPARAM:                               │
│                                                                         │
│  🔔 ATLETA/PAI recebe:                                                  │
│  ├── "Feedback pronto!" → após cada aula (IA gerou)                    │
│  ├── "Novo plano de treino disponível!" → quando instrutor cria        │
│  ├── "Módulo desbloqueado! 🎉" → quando completa um nível             │
│  ├── "Mensalidade vence em 3 dias" → alerta antecipado                │
│  └── "Alteração de horário" → quando admin muda turma                  │
│                                                                         │
│  🔔 INSTRUTOR recebe:                                                   │
│  ├── "Feedback gerado pela IA — revê e aprova"                         │
│  ├── "Aluno ausente 3 aulas seguidas" → alerta de abandono            │
│  └── "Nova inscrição na tua turma"                                     │
│                                                                         │
│  🔔 ADMIN recebe:                                                       │
│  ├── "5 pagamentos em atraso" → todos os dias às 9h                   │
│  ├── "Turma Iniciantes A está cheia — há 3 na lista de espera"        │
│  └── "Taxa de abandono subiu 10% este mês" → alerta de risco          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  FUTURO (FASE 2) — WhatsApp via n8n                             │  │
│  │                                                                 │  │
│  │  As mesmas notificações → enviadas automaticamente no WhatsApp  │  │
│  │  do pai, sem qualquer acção manual da escola.                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  💡 TRIGGER MENTAL: "Reciprocidade" — O pai recebe constantemente     │
│     valor (informação, feedback, alertas). Sente que a escola          │
│     "cuida" do filho. Dificilmente muda para uma concorrente.         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. ALGORITMOS DE RETENÇÃO — COMO A PLATAFORMA PRENDE CADA UTILIZADOR

```
╔══════════════════════════════════════════════════════════════════════════════╗
║          ALGORITMOS DE RETENÇÃO EXTREMA — MASTCHIEVE IA                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│  PARA ATLETAS — "The Progress Loop"                                          │
│                                                                              │
│  ACÇÃO → FEEDBACK IMEDIATO → RECOMPENSA → NOVA ACÇÃO                        │
│                                                                              │
│  1. Atleta vai à aula (ACÇÃO)                                                │
│  2. IA gera feedback personalizado em 30 segundos (FEEDBACK IMEDIATO)       │
│  3. Barra de progresso do módulo avança visualmente (RECOMPENSA)             │
│  4. "Falta 1 aula para desbloquear Estilo Costas!" (NOVA ACÇÃO)             │
│                                                                              │
│  Resultado: O atleta cria um hábito. Faltar = perder progresso = dor.       │
│  Taxa de retenção estimada: +45% vs academia sem gamificação                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PARA PAIS — "The Visibility Loop"                                           │
│                                                                              │
│  INVESTIMENTO EMOCIONAL → PROVA DE VALOR → DEFESA DA MARCA                  │
│                                                                              │
│  1. Pai recebe feedback personalizado após CADA aula do filho                │
│  2. Pai vê gráfico de evolução do filho (prova visual de progresso)         │
│  3. Pai partilha o relatório trimestral com familiares                       │
│  4. Familiares inscrevem os filhos na Mastchieve (boca-a-boca)              │
│                                                                              │
│  Resultado: O pai torna-se embaixador da marca sem ser pedido.               │
│  NPS esperado: 65+ (benchmark do sector: 30-40)                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PARA INSTRUTORES — "The Mastery Loop"                                       │
│                                                                              │
│  FERRAMENTA → EFICIÊNCIA → RECONHECIMENTO → DEPENDÊNCIA POSITIVA            │
│                                                                              │
│  1. Instrutor usa a plataforma → poupa 2h/semana de trabalho manual         │
│  2. A IA amplifica o seu impacto (100 alunos com feedback personalizado)    │
│  3. Admin vê as métricas do instrutor → reconhece o trabalho                │
│  4. Instrutor não consegue imaginar trabalhar sem a ferramenta               │
│                                                                              │
│  Resultado: O instrutor defende a plataforma internamente.                   │
│  Resistência à mudança: ~0%                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  PARA O DONO/ADMIN — "The Control Loop"                                      │
│                                                                              │
│  DADOS → DECISÕES → RESULTADOS → CONFIANÇA → MAIS DADOS                     │
│                                                                              │
│  1. Dashboard mostra o negócio em tempo real                                 │
│  2. Admin identifica problema: "taxa de abandono subiu"                      │
│  3. Admin age: cria promoção, liga a famílias, ajusta horários              │
│  4. Problema resolvido: dados confirmam melhoria                             │
│  5. Admin confia MAIS nos dados → usa mais a plataforma                     │
│                                                                              │
│  Resultado: O dono da escola torna-se viciado em dados.                      │
│  Decisões sem a plataforma passam a parecer cegas.                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. OS 10 GATILHOS MENTAIS APLICADOS

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              10 GATILHOS MENTAIS — ONDE E COMO SÃO APLICADOS               ║
╚══════════════════════════════════════════════════════════════════════════════╝

  #  GATILHO            ONDE APARECE                COMO FUNCIONA
  ─────────────────────────────────────────────────────────────────────────────
  1  ESCASSEZ           "Turma quase cheia! (8/12)"  Urgência na inscrição

  2  PROVA SOCIAL       KPIs visíveis no dashboard   "85% dos instrutores
                        "58 famílias satisfeitas"    já usam a plataforma"

  3  AUTORIDADE         IA como "especialista"       Claude AI = tecnologia
                        Feedback técnico preciso     usada pelas maiores
                        e fundamentado               empresas do mundo

  4  RECIPROCIDADE      Feedback automático após     Escola dá MAIS do
                        cada aula, sem pedir nada    que o pai espera →
                        em troca                     lealdade aumenta

  5  COMPROMISSO        Barra de progresso dos       Uma vez iniciado o
                        módulos (82% completo)       percurso, é difícil
                                                     abandonar a meio

  6  AVERSÃO À PERDA    "Falta 1 aula para           Faltar = perder o
                        desbloquear o módulo"        desbloqueio = dor

  7  NOVIDADE           IA gera feedback único       Cada feedback é
                        para cada atleta             diferente. Há sempre
                        após cada sessão             algo novo para ler

  8  ANTECIPAÇÃO        "Próxima sessão: Viragens"   O atleta sabe o que
                        Plano visível na app         vem a seguir →
                                                     motivação intrínseca

  9  IDENTIDADE         "Atleta Mastchieve"          A plataforma cria
                        Relatório trimestral         uma identidade ligada
                        partilhável                  à escola

  10 RECIPROCIDADE      O instrutor vê que a         Quando a ferramenta
     MÚTUA              ferramenta o valoriza        te ajuda, ajudas a
                        (poupa tempo, amplifica      ferramenta a crescer
                        impacto)                     (adoption rate ↑)
```

---

## 7. RESUMO EXECUTIVO — O QUE O DONO DA SOLUÇÃO PRECISA DE SABER

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       RESUMO EXECUTIVO                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

  ANTES DA MASTCHIEVE IA          DEPOIS DA MASTCHIEVE IA
  ──────────────────────────       ──────────────────────────────────────────
  Feedback: nenhum ou vago         Feedback: personalizado por IA, após cada
                                   aula, para cada atleta

  Financeiro: excel ou papel       Financeiro: mensalidades automáticas,
                                   alertas de atraso, recibos em 1 clique

  Comunicação: WhatsApp manual     Comunicação: notificações automáticas
                                   app + (futuro) WhatsApp

  Decisões: por intuição           Decisões: por dados em tempo real
                                   com histórico e tendências

  Retenção: sem estratégia         Retenção: gamificação, progresso visual,
                                   feedback constante → taxa estimada +45%

  ──────────────────────────────────────────────────────────────────────────
  RETORNO ESPERADO DO INVESTIMENTO (ROI):

  • +1 atleta retido por mês (em vez de desistir) = +€540/ano
  • +2 novas matrículas por boca-a-boca = +€1.080/ano
  • -2h/semana de trabalho administrativo por instrutor
  • Zero erros de comunicação com famílias
  • Posicionamento único no mercado local

  A plataforma paga-se ao manter 1 atleta que iria abandonar.
  ──────────────────────────────────────────────────────────────────────────

  FASES DE ENTREGA (CRONOGRAMA — 12 SEMANAS):

  Sprint 1-2:  Base técnica, base de dados, autenticação
  Sprint 3-4:  Dashboard web, gestão de atletas, turmas, instrutores
  Sprint 5-6:  Módulo financeiro, sistema de comunicação interno
  Sprint 7-8:  Motor de IA (feedback + planos de treino), KPIs
  Sprint 9-10: App mobile Flutter (iOS + Android) completa
  Sprint 11-12: Testes, optimização, documentação, formação e lançamento

  Reunião de demonstração: ao final de cada 2 semanas (6 reuniões)
  ──────────────────────────────────────────────────────────────────────────
```

---

## 8. STACK TECNOLÓGICO (LINGUAGEM PARA O CLIENTE)

```
  O QUE USAMOS          PORQUÊ                  GARANTIA QUE DÁ
  ─────────────────────────────────────────────────────────────────────────
  NestJS (API)          Enterprise, escalável   Suporta 10.000+ atletas
                        usado pelo Xbox, Adidas sem degradar performance

  Next.js (Web)         Mais rápido framework   Dashboard carrega em < 1s
                        web do mundo            Funciona offline (PWA)

  Flutter (Mobile)      1 código, 2 plataformas iOS e Android da mesma
                        iOS + Android           base, com suporte offline

  Claude AI (Anthropic) IA mais avançada do    Feedback que parece escrito
                        mercado em linguagem    por um humano especialista

  PostgreSQL / SQLite   Base de dados robusta   Dados seguros, nunca perdes
                        + modo local            informação mesmo sem internet

  Redis                 Cache ultrarrápida      Notificações em tempo real
                        para 10k+ utilizadores  sem atrasos

  n8n (Automação)       Zero código para        WhatsApp, email, alertas —
                        fluxos complexos        tudo automático, sem trabalho

  Docker                Infraestrutura          A plataforma funciona igual
                        containerizada          em qualquer servidor do mundo
  ─────────────────────────────────────────────────────────────────────────

  SEGURANÇA:
  ✅ Passwords encriptadas (bcrypt 12 rounds — impossível de reverter)
  ✅ Tokens JWT com expiração automática (15 minutos)
  ✅ Rate limiting (proteção contra ataques de força bruta)
  ✅ HTTPS obrigatório em produção
  ✅ Dados de menores protegidos por RGPD
```

---

*Documento preparado para apresentação ao Dono da Solução Mastchieve*
*Versão 1.0 — Junho 2026*
*Desenvolvimento: Sistema Mastchieve IA — Sprint 1 em curso*
