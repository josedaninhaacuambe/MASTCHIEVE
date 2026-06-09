# Mastchieve IA — Arquitetura do Sistema

## Stack Tecnológico

### Backend (apps/api)
- **NestJS 10** — Framework enterprise TypeScript, modular e escalável
- **PostgreSQL 16** — Base de dados principal com suporte a full-text search
- **Redis 7** — Cache, sessões e filas de background jobs
- **Prisma 6** — ORM type-safe com migrações automáticas
- **Bull** — Processamento de filas para geração de feedback IA
- **Socket.io** — WebSockets para notificações em tempo real
- **Passport JWT** — Autenticação com access token (15min) + refresh token (7d)
- **Swagger** — Documentação automática da API

### IA & Automação
- **Claude API (claude-sonnet-4-6)** — Motor LLM para geração de feedback personalizado
- **n8n** — Orquestração de workflows de automação (futuro: WhatsApp, email)
- **Bull Queues** — Processamento assíncrono de feedback para 10.000 atletas

### Dashboard Web (apps/web)
- **Next.js 14** (App Router) — SSR + React Server Components
- **TypeScript** — Type safety em todo o frontend
- **Tailwind CSS** + cores Mastchieve personalizadas
- **TanStack Query** — Cache inteligente, sync automático, retry
- **Zustand** — Estado global mínimo (auth, UI)
- **Recharts** — Gráficos de desempenho e KPIs
- **PWA** (next-pwa + Workbox) — Funciona offline com Service Workers + cache

### App Mobile (apps/mobile)
- **Flutter 3** — Uma única codebase para iOS e Android
- **Riverpod 2** — State management reativo e testável
- **Hive** — Armazenamento local offline (auth, cache de dados)
- **Drift** — SQLite tipado para dados estruturados offline
- **Go Router** — Navegação declarativa com deep linking
- **Dio** — HTTP client com interceptors para refresh token
- **fl_chart** — Gráficos de progressão do atleta
- **Firebase Messaging** — Push notifications

### Infraestrutura
- **Docker Compose** — Orquestra todos os serviços localmente
- **Nginx** — Reverse proxy, rate limiting, gzip
- **Docker volumes** — Persistência de dados PostgreSQL e Redis

## Suporte Offline

### Web (PWA)
- Service Workers com Workbox para cache de API responses
- IndexedDB via next-pwa para dados offline
- Indicador visual de conectividade no header

### Mobile (Flutter)
- Hive Box para cache de dados em memória local
- Sync Queue: operações offline são guardadas e enviadas quando a ligação retorna
- `connectivity_plus` deteta mudanças de rede em tempo real
- Dados expiram por TTL configurável por endpoint

## Escalabilidade para 10.000 Atletas

- **Paginação** em todos os endpoints (default: 20 registos)
- **Índices PostgreSQL** nas colunas de pesquisa e filtro
- **Redis cache** para KPIs e dados frequentemente acedidos
- **Bull queues** processam feedback IA de forma assíncrona (sem bloquear requests)
- **Rate limiting** por IP e por utilizador
- **Connection pooling** no Prisma

## Segurança

- JWT com refresh token rotation
- Bcrypt (12 rounds) para passwords
- Helmet.js para headers HTTP seguros
- CORS configurado para origens específicas
- Rate limiting (auth: 10/min, API: 100/min)
- RBAC (Roles: ADMIN, INSTRUCTOR, STUDENT, PARENT)
- Audit log de ações críticas

## KPIs do Projeto

| Indicador | Meta Inicial | Meta Alvo |
|-----------|-------------|-----------|
| Concordância Avaliativa IA | ≥ 85% | 92% |
| Progressão Modular | +15% vs pré-IA | +20% |
| Tempo de Relatório | ≤ 24h | Imediato |
| NPS Famílias | ≥ 50 | 65 |
| Adoção Instrutores | ≥ 70% | 90% |
