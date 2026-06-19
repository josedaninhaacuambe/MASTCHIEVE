-- ─────────────────────────────────────────────────────────────────────────────
-- MASTCHIEVE IA — MySQL (XAMPP) Database Init Script
-- Servidor: Windows + XAMPP | mastchieve.co.mz
--
-- Como executar:
--   Opção A: phpMyAdmin → SQL → Colar este conteúdo → Executar
--   Opção B: Linha de comandos → mysql -u root -p < init-mysql.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Criar base de dados com charset correcto
CREATE DATABASE IF NOT EXISTS mastchieve_prod
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Criar utilizador da aplicação
-- !! ALTERAR 'SENHA_FORTE_AQUI' por uma senha segura !!
CREATE USER IF NOT EXISTS 'mastchieve_user'@'localhost' IDENTIFIED BY 'ALTERAR_SENHA_DB';
GRANT ALL PRIVILEGES ON mastchieve_prod.* TO 'mastchieve_user'@'localhost';
FLUSH PRIVILEGES;

-- 3. Usar a base de dados
USE mastchieve_prod;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTA: O Prisma cria as tabelas automaticamente ao executar:
--       npx prisma migrate deploy
--
-- As tabelas abaixo são apenas para referência / restauro manual de emergência.
-- Em operação normal, USE SEMPRE o comando Prisma acima.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `users` (
  `id`           VARCHAR(36)  NOT NULL,
  `email`        VARCHAR(191) NOT NULL,
  `password`     VARCHAR(255) NOT NULL,
  `role`         VARCHAR(50)  NOT NULL DEFAULT 'VISITOR',
  `isActive`     TINYINT(1)   NOT NULL DEFAULT 1,
  `lastLoginAt`  DATETIME(3),
  `refreshToken` TEXT,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  INDEX `users_role_idx` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admins` (
  `id`        VARCHAR(36)  NOT NULL,
  `userId`    VARCHAR(36)  NOT NULL,
  `firstName` VARCHAR(191) NOT NULL,
  `lastName`  VARCHAR(191) NOT NULL,
  `phone`     VARCHAR(191),
  `avatarUrl` VARCHAR(191),
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_userId_key` (`userId`),
  CONSTRAINT `admins_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `instructors` (
  `id`              VARCHAR(36)  NOT NULL,
  `userId`          VARCHAR(36)  NOT NULL,
  `firstName`       VARCHAR(191) NOT NULL,
  `lastName`        VARCHAR(191) NOT NULL,
  `phone`           VARCHAR(191),
  `avatarUrl`       VARCHAR(500),
  `specializations` TEXT         NOT NULL,
  `bio`             TEXT,
  `isActive`        TINYINT(1)   NOT NULL DEFAULT 1,
  `hireDate`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `instructors_userId_key` (`userId`),
  INDEX `instructors_isActive_idx` (`isActive`),
  CONSTRAINT `instructors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `students` (
  `id`               VARCHAR(36)  NOT NULL,
  `userId`           VARCHAR(36)  NOT NULL,
  `firstName`        VARCHAR(191) NOT NULL,
  `lastName`         VARCHAR(191) NOT NULL,
  `dateOfBirth`      DATETIME(3)  NOT NULL,
  `gender`           VARCHAR(50)  NOT NULL DEFAULT 'OTHER',
  `phone`            VARCHAR(191),
  `avatarUrl`        VARCHAR(500),
  `medicalNotes`     TEXT,
  `emergencyContact` VARCHAR(191),
  `emergencyPhone`   VARCHAR(191),
  `enrollmentDate`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `isActive`         TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_userId_key` (`userId`),
  INDEX `students_isActive_idx` (`isActive`),
  CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `parents` (
  `id`           VARCHAR(36)  NOT NULL,
  `userId`       VARCHAR(36)  NOT NULL,
  `firstName`    VARCHAR(191) NOT NULL,
  `lastName`     VARCHAR(191) NOT NULL,
  `phone`        VARCHAR(191) NOT NULL,
  `relationship` VARCHAR(100) NOT NULL DEFAULT 'Parent',
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `parents_userId_key` (`userId`),
  CONSTRAINT `parents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `student_parents` (
  `studentId` VARCHAR(36) NOT NULL,
  `parentId`  VARCHAR(36) NOT NULL,
  `isPrimary` TINYINT(1)  NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`studentId`,`parentId`),
  CONSTRAINT `student_parents_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `student_parents_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `parents`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `classes` (
  `id`           VARCHAR(36)  NOT NULL,
  `name`         VARCHAR(191) NOT NULL,
  `description`  TEXT,
  `level`        VARCHAR(50)  NOT NULL DEFAULT 'BEGINNER',
  `status`       VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
  `maxStudents`  INT          NOT NULL DEFAULT 15,
  `poolLane`     VARCHAR(100),
  `schedules`    TEXT         NOT NULL,
  `instructorId` VARCHAR(36)  NOT NULL,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `classes_status_idx` (`status`),
  INDEX `classes_instructorId_idx` (`instructorId`),
  CONSTRAINT `classes_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `enrollments` (
  `id`         VARCHAR(36) NOT NULL,
  `studentId`  VARCHAR(36) NOT NULL,
  `classId`    VARCHAR(36) NOT NULL,
  `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `isActive`   TINYINT(1)  NOT NULL DEFAULT 1,
  `notes`      TEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollments_studentId_classId_key` (`studentId`,`classId`),
  INDEX `enrollments_isActive_idx` (`isActive`),
  CONSTRAINT `enrollments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollments_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `class_sessions` (
  `id`          VARCHAR(36)  NOT NULL,
  `classId`     VARCHAR(36)  NOT NULL,
  `sessionDate` DATETIME(3)  NOT NULL,
  `startTime`   VARCHAR(10)  NOT NULL,
  `endTime`     VARCHAR(10)  NOT NULL,
  `notes`       TEXT,
  `topic`       VARCHAR(500),
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `class_sessions_classId_idx` (`classId`),
  CONSTRAINT `class_sessions_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `attendances` (
  `id`           VARCHAR(36) NOT NULL,
  `sessionId`    VARCHAR(36) NOT NULL,
  `studentId`    VARCHAR(36) NOT NULL,
  `instructorId` VARCHAR(36) NOT NULL,
  `status`       VARCHAR(50) NOT NULL DEFAULT 'PRESENT',
  `notes`        TEXT,
  `markedAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `attendances_sessionId_studentId_key` (`sessionId`,`studentId`),
  INDEX `attendances_studentId_idx` (`studentId`),
  CONSTRAINT `attendances_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `class_sessions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `attendances_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `attendances_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `performance_records` (
  `id`              VARCHAR(36)   NOT NULL,
  `studentId`       VARCHAR(36)   NOT NULL,
  `sessionId`       VARCHAR(36),
  `instructorId`    VARCHAR(36),
  `technique`       INT,
  `stamina`         INT,
  `speed`           INT,
  `coordination`    INT,
  `breathing`       INT,
  `turns`           INT,
  `startDive`       INT,
  `overallScore`    DOUBLE,
  `instructorNotes` TEXT,
  `rawData`         TEXT,
  `recordedAt`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `performance_records_studentId_idx` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id`                   VARCHAR(36)  NOT NULL,
  `studentId`            VARCHAR(36)  NOT NULL,
  `sessionId`            VARCHAR(36),
  `instructorId`         VARCHAR(36),
  `performanceRecordId`  VARCHAR(36)  UNIQUE,
  `status`               VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
  `aiGeneratedText`      LONGTEXT,
  `instructorNotes`      TEXT,
  `finalText`            LONGTEXT,
  `recommendedLessons`   TEXT         NOT NULL,
  `interactiveExercises` TEXT         NOT NULL,
  `sentToParentAt`       DATETIME(3),
  `sentToStudentAt`      DATETIME(3),
  `aiModel`              VARCHAR(191),
  `aiTokensUsed`         INT,
  `aiConfidenceScore`    DOUBLE,
  `createdAt`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`            DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `feedbacks_studentId_idx` (`studentId`),
  INDEX `feedbacks_status_idx` (`status`),
  CONSTRAINT `feedbacks_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `swimming_modules` (
  `id`          VARCHAR(36)  NOT NULL,
  `name`        VARCHAR(191) NOT NULL,
  `description` TEXT,
  `level`       VARCHAR(50)  NOT NULL DEFAULT 'BEGINNER',
  `order`       INT          NOT NULL,
  `skills`      TEXT         NOT NULL,
  `videos`      TEXT         NOT NULL,
  `isActive`    TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `progress` (
  `id`          VARCHAR(36) NOT NULL,
  `studentId`   VARCHAR(36) NOT NULL,
  `moduleId`    VARCHAR(36) NOT NULL,
  `status`      VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
  `startedAt`   DATETIME(3),
  `completedAt` DATETIME(3),
  `score`       DOUBLE,
  `notes`       TEXT,
  `updatedAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `progress_studentId_moduleId_key` (`studentId`,`moduleId`),
  INDEX `progress_studentId_idx` (`studentId`),
  CONSTRAINT `progress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `progress_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `swimming_modules`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `training_plans` (
  `id`           VARCHAR(36)  NOT NULL,
  `studentId`    VARCHAR(36)  NOT NULL,
  `instructorId` VARCHAR(36),
  `title`        VARCHAR(500) NOT NULL,
  `description`  TEXT,
  `objectives`   TEXT         NOT NULL,
  `exercises`    TEXT         NOT NULL,
  `aiGenerated`  TINYINT(1)   NOT NULL DEFAULT 0,
  `isActive`     TINYINT(1)   NOT NULL DEFAULT 1,
  `validFrom`    DATETIME(3)  NOT NULL,
  `validUntil`   DATETIME(3),
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `training_plans_studentId_idx` (`studentId`),
  CONSTRAINT `training_plans_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `monthly_fees` (
  `id`          VARCHAR(36) NOT NULL,
  `studentId`   VARCHAR(36) NOT NULL,
  `month`       INT         NOT NULL,
  `year`        INT         NOT NULL,
  `amount`      DOUBLE      NOT NULL,
  `dueDate`     DATETIME(3) NOT NULL,
  `description` VARCHAR(500),
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `monthly_fees_studentId_month_year_key` (`studentId`,`month`,`year`),
  INDEX `monthly_fees_studentId_idx` (`studentId`),
  CONSTRAINT `monthly_fees_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id`            VARCHAR(36)  NOT NULL,
  `studentId`     VARCHAR(36)  NOT NULL,
  `monthlyFeeId`  VARCHAR(36)  UNIQUE,
  `amount`        DOUBLE       NOT NULL,
  `method`        VARCHAR(50)  NOT NULL DEFAULT 'CASH',
  `status`        VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
  `reference`     VARCHAR(191),
  `receiptNumber` VARCHAR(191) UNIQUE,
  `notes`         TEXT,
  `paidAt`        DATETIME(3),
  `dueDate`       DATETIME(3)  NOT NULL,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `payments_studentId_idx` (`studentId`),
  INDEX `payments_status_idx` (`status`),
  CONSTRAINT `payments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_monthlyFeeId_fkey` FOREIGN KEY (`monthlyFeeId`) REFERENCES `monthly_fees`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id`        VARCHAR(36)  NOT NULL,
  `userId`    VARCHAR(36)  NOT NULL,
  `type`      VARCHAR(50)  NOT NULL DEFAULT 'INFO',
  `title`     VARCHAR(500) NOT NULL,
  `body`      TEXT         NOT NULL,
  `data`      TEXT,
  `readAt`    DATETIME(3),
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `notifications_userId_idx` (`userId`),
  CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `documents` (
  `id`         VARCHAR(36)  NOT NULL,
  `studentId`  VARCHAR(36)  NOT NULL,
  `name`       VARCHAR(500) NOT NULL,
  `type`       VARCHAR(100) NOT NULL,
  `url`        VARCHAR(1000) NOT NULL,
  `size`       INT,
  `uploadedAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `documents_studentId_idx` (`studentId`),
  CONSTRAINT `documents_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`        VARCHAR(36)  NOT NULL,
  `userId`    VARCHAR(36)  NOT NULL,
  `action`    VARCHAR(100) NOT NULL,
  `entity`    VARCHAR(100) NOT NULL,
  `entityId`  VARCHAR(36),
  `oldValues` TEXT,
  `newValues` TEXT,
  `ipAddress` VARCHAR(50),
  `userAgent` TEXT,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `audit_logs_userId_idx` (`userId`),
  CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `kpi_snapshots` (
  `id`                     VARCHAR(36) NOT NULL,
  `snapshotDate`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `totalStudents`          INT         NOT NULL,
  `activeStudents`         INT         NOT NULL,
  `totalInstructors`       INT         NOT NULL,
  `totalClasses`           INT         NOT NULL,
  `attendanceRate`         DOUBLE      NOT NULL,
  `avgFeedbackScore`       DOUBLE,
  `npsScore`               DOUBLE,
  `instructorAdoptionRate` DOUBLE,
  `overduePayments`        INT         NOT NULL,
  `monthlyRevenue`         DOUBLE,
  `createdAt`              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Prisma migration tracking ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `_prisma_migrations` (
  `id`                  VARCHAR(36)  NOT NULL,
  `checksum`            VARCHAR(64)  NOT NULL,
  `finished_at`         DATETIME(3),
  `migration_name`      VARCHAR(255) NOT NULL,
  `logs`                TEXT,
  `rolled_back_at`      DATETIME(3),
  `started_at`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Utilizador administrador inicial ─────────────────────────────────────────
-- Senha inicial: Admin@Mastchieve2025
-- ALTERAR IMEDIATAMENTE após o primeiro login!
INSERT IGNORE INTO `users` (`id`,`email`,`password`,`role`,`isActive`,`createdAt`,`updatedAt`)
VALUES (
  UUID(),
  'admin@mastchieve.co.mz',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TdmYfHxK5G8i3HJ4bN0WvM2qVkKu',
  'ADMIN',
  1,
  NOW(),
  NOW()
);

INSERT IGNORE INTO `admins` (`id`,`userId`,`firstName`,`lastName`,`createdAt`,`updatedAt`)
SELECT UUID(), id, 'Administrador', 'Mastchieve', NOW(), NOW()
FROM `users` WHERE email = 'admin@mastchieve.co.mz';
