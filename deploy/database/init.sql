-- ─────────────────────────────────────────────────────────────────────────────
-- MASTCHIEVE IA — PostgreSQL Database Init Script
-- Servidor: mastchieve.co.mz
-- Executar como: psql -U postgres -f init.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Criar utilizador da aplicação
CREATE USER mastchieve_user WITH PASSWORD 'ALTERAR_ESTA_SENHA_FORTE';

-- 2. Criar base de dados
CREATE DATABASE mastchieve_prod
  WITH OWNER = mastchieve_user
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

-- 3. Garantir privilégios
GRANT ALL PRIVILEGES ON DATABASE mastchieve_prod TO mastchieve_user;

-- 4. Conectar à base de dados
\c mastchieve_prod

-- 5. Activar extensão UUID (necessária para gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- TABELAS (geradas a partir do Prisma schema)
-- Nota: O Prisma gera as tabelas automaticamente via `prisma migrate deploy`
-- Este SQL é apenas para referência / restauro manual
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "users" (
  "id"           TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "email"        TEXT         NOT NULL,
  "password"     TEXT         NOT NULL,
  "role"         TEXT         NOT NULL DEFAULT 'VISITOR',
  "isActive"     BOOLEAN      NOT NULL DEFAULT true,
  "lastLoginAt"  TIMESTAMPTZ,
  "refreshToken" TEXT,
  "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");

CREATE TABLE IF NOT EXISTS "admins" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT        NOT NULL,
  "firstName" TEXT        NOT NULL,
  "lastName"  TEXT        NOT NULL,
  "phone"     TEXT,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admins_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "admins_userId_key" ON "admins"("userId");

CREATE TABLE IF NOT EXISTS "instructors" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"          TEXT        NOT NULL,
  "firstName"       TEXT        NOT NULL,
  "lastName"        TEXT        NOT NULL,
  "phone"           TEXT,
  "avatarUrl"       TEXT,
  "specializations" TEXT        NOT NULL DEFAULT '[]',
  "bio"             TEXT,
  "isActive"        BOOLEAN     NOT NULL DEFAULT true,
  "hireDate"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "instructors_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "instructors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "instructors_userId_key" ON "instructors"("userId");
CREATE INDEX IF NOT EXISTS "instructors_isActive_idx" ON "instructors"("isActive");

CREATE TABLE IF NOT EXISTS "students" (
  "id"               TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"           TEXT        NOT NULL,
  "firstName"        TEXT        NOT NULL,
  "lastName"         TEXT        NOT NULL,
  "dateOfBirth"      TIMESTAMPTZ NOT NULL,
  "gender"           TEXT        NOT NULL DEFAULT 'OTHER',
  "phone"            TEXT,
  "avatarUrl"        TEXT,
  "medicalNotes"     TEXT,
  "emergencyContact" TEXT,
  "emergencyPhone"   TEXT,
  "enrollmentDate"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive"         BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "students_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "students_userId_key" ON "students"("userId");
CREATE INDEX IF NOT EXISTS "students_isActive_idx" ON "students"("isActive");

CREATE TABLE IF NOT EXISTS "parents" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"       TEXT        NOT NULL,
  "firstName"    TEXT        NOT NULL,
  "lastName"     TEXT        NOT NULL,
  "phone"        TEXT        NOT NULL,
  "relationship" TEXT        NOT NULL DEFAULT 'Parent',
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "parents_userId_key" ON "parents"("userId");

CREATE TABLE IF NOT EXISTS "student_parents" (
  "studentId" TEXT        NOT NULL,
  "parentId"  TEXT        NOT NULL,
  "isPrimary" BOOLEAN     NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_parents_pkey" PRIMARY KEY ("studentId","parentId"),
  CONSTRAINT "student_parents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "student_parents_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "classes" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "name"         TEXT        NOT NULL,
  "description"  TEXT,
  "level"        TEXT        NOT NULL DEFAULT 'BEGINNER',
  "status"       TEXT        NOT NULL DEFAULT 'ACTIVE',
  "maxStudents"  INTEGER     NOT NULL DEFAULT 15,
  "poolLane"     TEXT,
  "schedules"    TEXT        NOT NULL DEFAULT '[]',
  "instructorId" TEXT        NOT NULL,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "classes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "classes_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id")
);
CREATE INDEX IF NOT EXISTS "classes_status_idx" ON "classes"("status");
CREATE INDEX IF NOT EXISTS "classes_instructorId_idx" ON "classes"("instructorId");

CREATE TABLE IF NOT EXISTS "enrollments" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId"  TEXT        NOT NULL,
  "classId"    TEXT        NOT NULL,
  "enrolledAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive"   BOOLEAN     NOT NULL DEFAULT true,
  "notes"      TEXT,
  CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "enrollments_studentId_classId_key" UNIQUE ("studentId","classId"),
  CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "enrollments_isActive_idx" ON "enrollments"("isActive");

CREATE TABLE IF NOT EXISTS "class_sessions" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "classId"     TEXT        NOT NULL,
  "sessionDate" TIMESTAMPTZ NOT NULL,
  "startTime"   TEXT        NOT NULL,
  "endTime"     TEXT        NOT NULL,
  "notes"       TEXT,
  "topic"       TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "class_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "class_sessions_classId_idx" ON "class_sessions"("classId");

CREATE TABLE IF NOT EXISTS "attendances" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "sessionId"    TEXT        NOT NULL,
  "studentId"    TEXT        NOT NULL,
  "instructorId" TEXT        NOT NULL,
  "status"       TEXT        NOT NULL DEFAULT 'PRESENT',
  "notes"        TEXT,
  "markedAt"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attendances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attendances_sessionId_studentId_key" UNIQUE ("sessionId","studentId"),
  CONSTRAINT "attendances_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id") ON DELETE CASCADE,
  CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "attendances_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id")
);
CREATE INDEX IF NOT EXISTS "attendances_studentId_idx" ON "attendances"("studentId");

CREATE TABLE IF NOT EXISTS "performance_records" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId"       TEXT        NOT NULL,
  "sessionId"       TEXT,
  "instructorId"    TEXT,
  "technique"       INTEGER,
  "stamina"         INTEGER,
  "speed"           INTEGER,
  "coordination"    INTEGER,
  "breathing"       INTEGER,
  "turns"           INTEGER,
  "startDive"       INTEGER,
  "overallScore"    DOUBLE PRECISION,
  "instructorNotes" TEXT,
  "rawData"         TEXT,
  "recordedAt"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "performance_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "performance_records_studentId_idx" ON "performance_records"("studentId");

CREATE TABLE IF NOT EXISTS "feedbacks" (
  "id"                   TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId"            TEXT        NOT NULL,
  "sessionId"            TEXT,
  "instructorId"         TEXT,
  "performanceRecordId"  TEXT,
  "status"               TEXT        NOT NULL DEFAULT 'PENDING',
  "aiGeneratedText"      TEXT,
  "instructorNotes"      TEXT,
  "finalText"            TEXT,
  "recommendedLessons"   TEXT        NOT NULL DEFAULT '[]',
  "interactiveExercises" TEXT        NOT NULL DEFAULT '[]',
  "sentToParentAt"       TIMESTAMPTZ,
  "sentToStudentAt"      TIMESTAMPTZ,
  "aiModel"              TEXT,
  "aiTokensUsed"         INTEGER,
  "aiConfidenceScore"    DOUBLE PRECISION,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "feedbacks_performanceRecordId_key" UNIQUE ("performanceRecordId"),
  CONSTRAINT "feedbacks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "feedbacks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "class_sessions"("id"),
  CONSTRAINT "feedbacks_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id"),
  CONSTRAINT "feedbacks_performanceRecordId_fkey" FOREIGN KEY ("performanceRecordId") REFERENCES "performance_records"("id")
);
CREATE INDEX IF NOT EXISTS "feedbacks_studentId_idx" ON "feedbacks"("studentId");
CREATE INDEX IF NOT EXISTS "feedbacks_status_idx" ON "feedbacks"("status");

CREATE TABLE IF NOT EXISTS "swimming_modules" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT        NOT NULL,
  "description" TEXT,
  "level"       TEXT        NOT NULL DEFAULT 'BEGINNER',
  "order"       INTEGER     NOT NULL,
  "skills"      TEXT        NOT NULL DEFAULT '[]',
  "videos"      TEXT        NOT NULL DEFAULT '[]',
  "isActive"    BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "swimming_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "progress" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId"   TEXT        NOT NULL,
  "moduleId"    TEXT        NOT NULL,
  "status"      TEXT        NOT NULL DEFAULT 'NOT_STARTED',
  "startedAt"   TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "score"       DOUBLE PRECISION,
  "notes"       TEXT,
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "progress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "progress_studentId_moduleId_key" UNIQUE ("studentId","moduleId"),
  CONSTRAINT "progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "swimming_modules"("id")
);
CREATE INDEX IF NOT EXISTS "progress_studentId_idx" ON "progress"("studentId");

CREATE TABLE IF NOT EXISTS "training_plans" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId"    TEXT        NOT NULL,
  "instructorId" TEXT,
  "title"        TEXT        NOT NULL,
  "description"  TEXT,
  "objectives"   TEXT        NOT NULL DEFAULT '[]',
  "exercises"    TEXT        NOT NULL DEFAULT '[]',
  "aiGenerated"  BOOLEAN     NOT NULL DEFAULT false,
  "isActive"     BOOLEAN     NOT NULL DEFAULT true,
  "validFrom"    TIMESTAMPTZ NOT NULL,
  "validUntil"   TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_plans_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "training_plans_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructors"("id")
);
CREATE INDEX IF NOT EXISTS "training_plans_studentId_idx" ON "training_plans"("studentId");

CREATE TABLE IF NOT EXISTS "monthly_fees" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId"   TEXT        NOT NULL,
  "month"       INTEGER     NOT NULL,
  "year"        INTEGER     NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL,
  "dueDate"     TIMESTAMPTZ NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "monthly_fees_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "monthly_fees_studentId_month_year_key" UNIQUE ("studentId","month","year"),
  CONSTRAINT "monthly_fees_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "monthly_fees_studentId_idx" ON "monthly_fees"("studentId");

CREATE TABLE IF NOT EXISTS "payments" (
  "id"            TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId"     TEXT        NOT NULL,
  "monthlyFeeId"  TEXT,
  "amount"        DOUBLE PRECISION NOT NULL,
  "method"        TEXT        NOT NULL DEFAULT 'CASH',
  "status"        TEXT        NOT NULL DEFAULT 'PENDING',
  "reference"     TEXT,
  "receiptNumber" TEXT,
  "notes"         TEXT,
  "paidAt"        TIMESTAMPTZ,
  "dueDate"       TIMESTAMPTZ NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_monthlyFeeId_key" UNIQUE ("monthlyFeeId"),
  CONSTRAINT "payments_receiptNumber_key" UNIQUE ("receiptNumber"),
  CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
  CONSTRAINT "payments_monthlyFeeId_fkey" FOREIGN KEY ("monthlyFeeId") REFERENCES "monthly_fees"("id")
);
CREATE INDEX IF NOT EXISTS "payments_studentId_idx" ON "payments"("studentId");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT        NOT NULL,
  "type"      TEXT        NOT NULL DEFAULT 'INFO',
  "title"     TEXT        NOT NULL,
  "body"      TEXT        NOT NULL,
  "data"      TEXT,
  "readAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");

CREATE TABLE IF NOT EXISTS "documents" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "studentId"  TEXT        NOT NULL,
  "name"       TEXT        NOT NULL,
  "type"       TEXT        NOT NULL,
  "url"        TEXT        NOT NULL,
  "size"       INTEGER,
  "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "documents_studentId_idx" ON "documents"("studentId");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id"        TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT        NOT NULL,
  "action"    TEXT        NOT NULL,
  "entity"    TEXT        NOT NULL,
  "entityId"  TEXT,
  "oldValues" TEXT,
  "newValues" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id")
);
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");

CREATE TABLE IF NOT EXISTS "kpi_snapshots" (
  "id"                     TEXT             NOT NULL DEFAULT gen_random_uuid()::text,
  "snapshotDate"           TIMESTAMPTZ      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "totalStudents"          INTEGER          NOT NULL,
  "activeStudents"         INTEGER          NOT NULL,
  "totalInstructors"       INTEGER          NOT NULL,
  "totalClasses"           INTEGER          NOT NULL,
  "attendanceRate"         DOUBLE PRECISION NOT NULL,
  "avgFeedbackScore"       DOUBLE PRECISION,
  "npsScore"               DOUBLE PRECISION,
  "instructorAdoptionRate" DOUBLE PRECISION,
  "overduePayments"        INTEGER          NOT NULL,
  "monthlyRevenue"         DOUBLE PRECISION,
  "createdAt"              TIMESTAMPTZ      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- ── Prisma migration tracking table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                  TEXT         NOT NULL,
  "checksum"            TEXT         NOT NULL,
  "finished_at"         TIMESTAMPTZ,
  "migration_name"      TEXT         NOT NULL,
  "logs"                TEXT,
  "rolled_back_at"      TIMESTAMPTZ,
  "started_at"          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "applied_steps_count" INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

-- ── Utilizador administrador inicial ─────────────────────────────────────────
-- Senha: Admin@Mastchieve2025 (bcrypt hash)
-- ALTERAR a senha imediatamente após o primeiro login!
INSERT INTO "users" ("id","email","password","role","isActive","createdAt","updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@mastchieve.co.mz',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TdmYfHxK5G8i3HJ4bN0WvM2qVkKu',
  'ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- Perfil admin
INSERT INTO "admins" ("id","userId","firstName","lastName","createdAt","updatedAt")
SELECT
  gen_random_uuid()::text,
  u.id,
  'Administrador',
  'Mastchieve',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "users" u WHERE u.email = 'admin@mastchieve.co.mz'
ON CONFLICT DO NOTHING;

GRANT ALL ON ALL TABLES IN SCHEMA public TO mastchieve_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO mastchieve_user;
