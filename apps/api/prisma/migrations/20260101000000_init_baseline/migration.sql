-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `refreshToken` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instructors` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `specializations` TEXT NOT NULL,
    `bio` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `hireDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `instructors_userId_key`(`userId`),
    INDEX `instructors_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NOT NULL,
    `gender` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `phone` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `medicalNotes` TEXT NULL,
    `emergencyContact` VARCHAR(191) NULL,
    `emergencyPhone` VARCHAR(191) NULL,
    `enrollmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `unidadeId` VARCHAR(191) NULL,
    `autorizacaoImagem` BOOLEAN NOT NULL DEFAULT false,
    `autorizacaoImagemData` DATETIME(3) NULL,
    `autorizacaoImagemDoc` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `students_userId_key`(`userId`),
    UNIQUE INDEX `students_leadId_key`(`leadId`),
    INDEX `students_isActive_idx`(`isActive`),
    INDEX `students_unidadeId_idx`(`unidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parents` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `relationship` VARCHAR(191) NOT NULL DEFAULT 'Parent',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `parents_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_parents` (
    `studentId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`studentId`, `parentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unidades` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'PRINCIPAL',
    `endereco` VARCHAR(191) NULL,
    `contacto` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `unidades_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instructor_unidades` (
    `id` VARCHAR(191) NOT NULL,
    `instrutorId` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `instructor_unidades_instrutorId_unidadeId_key`(`instrutorId`, `unidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `origem` VARCHAR(191) NOT NULL DEFAULT 'OUTRO',
    `campanha` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'NOVO',
    `unidadeId` VARCHAR(191) NULL,
    `eventoId` VARCHAR(191) NULL,
    `notas` TEXT NULL,
    `dataContacto` DATETIME(3) NULL,
    `dataAgendamento` DATETIME(3) NULL,
    `dataConversao` DATETIME(3) NULL,
    `motivoPerda` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `leads_estado_idx`(`estado`),
    INDEX `leads_unidadeId_idx`(`unidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacoes_iniciais` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `instrutorId` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `experienciaAquatica` INTEGER NOT NULL DEFAULT 1,
    `segurancaAdaptacao` INTEGER NOT NULL DEFAULT 1,
    `confortoAgua` INTEGER NOT NULL DEFAULT 1,
    `resistenciaBasica` INTEGER NOT NULL DEFAULT 1,
    `criteriosAvaliados` TEXT NOT NULL,
    `necessidadesEspeciais` TEXT NULL,
    `observacoes` TEXT NULL,
    `faseRecomendadaId` VARCHAR(191) NULL,
    `aprovadoPorId` VARCHAR(191) NULL,
    `aprovadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `avaliacoes_iniciais_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fases_progressao` (
    `id` VARCHAR(191) NOT NULL,
    `nivel` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `animal` VARCHAR(191) NOT NULL,
    `certificacao` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `foco` TEXT NULL,
    `escala` TEXT NOT NULL,
    `criterios` TEXT NOT NULL,
    `assiduidade` INTEGER NOT NULL DEFAULT 80,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `fases_progressao_nivel_ordem_key`(`nivel`, `ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_fases` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `faseId` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'NAO_INICIADO',
    `iniciadoEm` DATETIME(3) NULL,
    `concluidoEm` DATETIME(3) NULL,
    `pontuacao` DOUBLE NULL,
    `notas` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_fases_studentId_idx`(`studentId`),
    UNIQUE INDEX `student_fases_studentId_faseId_key`(`studentId`, `faseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificados` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `faseId` VARCHAR(191) NOT NULL,
    `dataEmissao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validadoPorId` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NULL,
    `numeroSerie` VARCHAR(191) NOT NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `certificados_numeroSerie_key`(`numeroSerie`),
    INDEX `certificados_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `classes` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `level` VARCHAR(191) NOT NULL DEFAULT 'BEGINNER',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `maxStudents` INTEGER NOT NULL DEFAULT 15,
    `poolLane` VARCHAR(191) NULL,
    `schedules` TEXT NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `classes_status_idx`(`status`),
    INDEX `classes_instructorId_idx`(`instructorId`),
    INDEX `classes_unidadeId_idx`(`unidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,

    INDEX `enrollments_isActive_idx`(`isActive`),
    UNIQUE INDEX `enrollments_studentId_classId_key`(`studentId`, `classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `sessionDate` DATETIME(3) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `topic` VARCHAR(191) NULL,
    `checklistEquipamentos` BOOLEAN NOT NULL DEFAULT false,
    `checklistSeguranca` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `class_sessions_classId_idx`(`classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PRESENT',
    `notes` TEXT NULL,
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attendances_studentId_idx`(`studentId`),
    UNIQUE INDEX `attendances_sessionId_studentId_key`(`sessionId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_records` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `instructorId` VARCHAR(191) NULL,
    `technique` INTEGER NULL,
    `stamina` INTEGER NULL,
    `speed` INTEGER NULL,
    `coordination` INTEGER NULL,
    `breathing` INTEGER NULL,
    `turns` INTEGER NULL,
    `startDive` INTEGER NULL,
    `overallScore` DOUBLE NULL,
    `instructorNotes` TEXT NULL,
    `acaoCorretiva` TEXT NULL,
    `rawData` TEXT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `performance_records_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedbacks` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `instructorId` VARCHAR(191) NULL,
    `performanceRecordId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `aiGeneratedText` LONGTEXT NULL,
    `instructorNotes` TEXT NULL,
    `finalText` LONGTEXT NULL,
    `recommendedLessons` TEXT NOT NULL,
    `interactiveExercises` TEXT NOT NULL,
    `sentToParentAt` DATETIME(3) NULL,
    `sentToStudentAt` DATETIME(3) NULL,
    `aiModel` VARCHAR(191) NULL,
    `aiTokensUsed` INTEGER NULL,
    `aiConfidenceScore` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `feedbacks_performanceRecordId_key`(`performanceRecordId`),
    INDEX `feedbacks_studentId_idx`(`studentId`),
    INDEX `feedbacks_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `swimming_modules` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `level` VARCHAR(191) NOT NULL DEFAULT 'BEGINNER',
    `order` INTEGER NOT NULL,
    `skills` TEXT NOT NULL,
    `videos` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progress` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `moduleId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `score` DOUBLE NULL,
    `notes` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `progress_studentId_idx`(`studentId`),
    UNIQUE INDEX `progress_studentId_moduleId_key`(`studentId`, `moduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `training_plans` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `objectives` TEXT NOT NULL,
    `exercises` TEXT NOT NULL,
    `aiGenerated` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `validFrom` DATETIME(3) NOT NULL,
    `validUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `training_plans_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_fees` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `monthly_fees_studentId_idx`(`studentId`),
    UNIQUE INDEX `monthly_fees_studentId_month_year_key`(`studentId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `monthlyFeeId` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `method` VARCHAR(191) NOT NULL DEFAULT 'CASH',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reference` VARCHAR(191) NULL,
    `receiptNumber` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_monthlyFeeId_key`(`monthlyFeeId`),
    UNIQUE INDEX `payments_receiptNumber_key`(`receiptNumber`),
    INDEX `payments_studentId_idx`(`studentId`),
    INDEX `payments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `protocolos` (
    `id` VARCHAR(191) NOT NULL,
    `ranking` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `dimensao` VARCHAR(191) NOT NULL,
    `prioridade` VARCHAR(191) NOT NULL,
    `justificacao` TEXT NOT NULL,
    `objetivo` TEXT NOT NULL,
    `momentoAplicacao` TEXT NOT NULL,
    `responsavel` VARCHAR(191) NOT NULL,
    `procedimento` TEXT NOT NULL,
    `checklistItems` TEXT NOT NULL,
    `sinaisAlerta` TEXT NOT NULL,
    `acaoFalha` TEXT NOT NULL,
    `isRelampago` BOOLEAN NOT NULL DEFAULT false,
    `isAtivo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `protocolos_ranking_key`(`ranking`),
    INDEX `protocolos_ranking_idx`(`ranking`),
    INDEX `protocolos_dimensao_idx`(`dimensao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `checklists_protocolo` (
    `id` VARCHAR(191) NOT NULL,
    `protocoloId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NULL,
    `instrutorId` VARCHAR(191) NOT NULL,
    `items` TEXT NOT NULL,
    `completado` BOOLEAN NOT NULL DEFAULT false,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `checklists_protocolo_protocoloId_idx`(`protocoloId`),
    INDEX `checklists_protocolo_instrutorId_idx`(`instrutorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incidentes` (
    `id` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` VARCHAR(191) NOT NULL,
    `tipoOcorrencia` VARCHAR(191) NOT NULL DEFAULT 'INCIDENTE_CONFIRMADO',
    `dimensoes` TEXT NOT NULL,
    `protocoloId` VARCHAR(191) NULL,
    `isRelampago` BOOLEAN NOT NULL DEFAULT false,
    `escalado` BOOLEAN NOT NULL DEFAULT false,
    `descricao` TEXT NOT NULL,
    `envolvidos` TEXT NOT NULL,
    `acaoImediata` TEXT NOT NULL,
    `relatorio` TEXT NULL,
    `acoesPreventivas` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'REPORTADO',
    `reportadoPorId` VARCHAR(191) NOT NULL,
    `resolvidoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `incidentes_estado_idx`(`estado`),
    INDEX `incidentes_unidadeId_idx`(`unidadeId`),
    INDEX `incidentes_tipoOcorrencia_idx`(`tipoOcorrencia`),
    INDEX `incidentes_protocoloId_idx`(`protocoloId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eventos` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'OPEN_DAY',
    `nome` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `programa` TEXT NULL,
    `capacidade` INTEGER NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PLANEADO',
    `notas` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `eventos_tipo_idx`(`tipo`),
    INDEX `eventos_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competicoes` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `local` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `descricao` TEXT NULL,
    `planoCompetitivo` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PLANEADA',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `competicoes_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `competicao_atletas` (
    `id` VARCHAR(191) NOT NULL,
    `competicaoId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `prova` VARCHAR(191) NULL,
    `resultado` VARCHAR(191) NULL,
    `posicao` INTEGER NULL,
    `notas` TEXT NULL,

    UNIQUE INDEX `competicao_atletas_competicaoId_studentId_key`(`competicaoId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos_comunicacao` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `prazo` DATETIME(3) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'RASCUNHO',
    `solicitanteId` VARCHAR(191) NOT NULL,
    `aprovadoPorId` VARCHAR(191) NULL,
    `aprovadoEm` DATETIME(3) NULL,
    `link` VARCHAR(191) NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pedidos_comunicacao_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `data` TEXT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `push_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(2048) NOT NULL,
    `p256dh` TEXT NOT NULL,
    `auth` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `push_subscriptions_userId_idx`(`userId`),
    UNIQUE INDEX `push_subscriptions_endpoint_key`(`endpoint`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `size` INTEGER NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documents_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `oldValues` TEXT NULL,
    `newValues` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kpi_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `snapshotDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalStudents` INTEGER NOT NULL,
    `activeStudents` INTEGER NOT NULL,
    `totalInstructors` INTEGER NOT NULL,
    `totalClasses` INTEGER NOT NULL,
    `attendanceRate` DOUBLE NOT NULL,
    `avgFeedbackScore` DOUBLE NULL,
    `npsScore` DOUBLE NULL,
    `instructorAdoptionRate` DOUBLE NULL,
    `overduePayments` INTEGER NOT NULL,
    `monthlyRevenue` DOUBLE NULL,
    `leadsGerados` INTEGER NULL,
    `conversaoLead` DOUBLE NULL,
    `incidentesCount` INTEGER NOT NULL DEFAULT 0,
    `participacaoOpenDay` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `kpi_snapshots_unidadeId_idx`(`unidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admins` ADD CONSTRAINT `admins_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructors` ADD CONSTRAINT `instructors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `parents` ADD CONSTRAINT `parents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_parents` ADD CONSTRAINT `student_parents_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_parents` ADD CONSTRAINT `student_parents_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `parents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructor_unidades` ADD CONSTRAINT `instructor_unidades_instrutorId_fkey` FOREIGN KEY (`instrutorId`) REFERENCES `instructors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instructor_unidades` ADD CONSTRAINT `instructor_unidades_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `eventos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_iniciais` ADD CONSTRAINT `avaliacoes_iniciais_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_iniciais` ADD CONSTRAINT `avaliacoes_iniciais_instrutorId_fkey` FOREIGN KEY (`instrutorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_iniciais` ADD CONSTRAINT `avaliacoes_iniciais_faseRecomendadaId_fkey` FOREIGN KEY (`faseRecomendadaId`) REFERENCES `fases_progressao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fases` ADD CONSTRAINT `student_fases_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fases` ADD CONSTRAINT `student_fases_faseId_fkey` FOREIGN KEY (`faseId`) REFERENCES `fases_progressao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificados` ADD CONSTRAINT `certificados_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificados` ADD CONSTRAINT `certificados_faseId_fkey` FOREIGN KEY (`faseId`) REFERENCES `fases_progressao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificados` ADD CONSTRAINT `certificados_validadoPorId_fkey` FOREIGN KEY (`validadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificados` ADD CONSTRAINT `certificados_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `eventos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `classes` ADD CONSTRAINT `classes_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_sessions` ADD CONSTRAINT `class_sessions_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `class_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `class_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_performanceRecordId_fkey` FOREIGN KEY (`performanceRecordId`) REFERENCES `performance_records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress` ADD CONSTRAINT `progress_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progress` ADD CONSTRAINT `progress_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `swimming_modules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_plans` ADD CONSTRAINT `training_plans_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `training_plans` ADD CONSTRAINT `training_plans_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_fees` ADD CONSTRAINT `monthly_fees_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_monthlyFeeId_fkey` FOREIGN KEY (`monthlyFeeId`) REFERENCES `monthly_fees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklists_protocolo` ADD CONSTRAINT `checklists_protocolo_protocoloId_fkey` FOREIGN KEY (`protocoloId`) REFERENCES `protocolos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklists_protocolo` ADD CONSTRAINT `checklists_protocolo_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `class_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `checklists_protocolo` ADD CONSTRAINT `checklists_protocolo_instrutorId_fkey` FOREIGN KEY (`instrutorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidentes` ADD CONSTRAINT `incidentes_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidentes` ADD CONSTRAINT `incidentes_reportadoPorId_fkey` FOREIGN KEY (`reportadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidentes` ADD CONSTRAINT `incidentes_protocoloId_fkey` FOREIGN KEY (`protocoloId`) REFERENCES `protocolos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `eventos` ADD CONSTRAINT `eventos_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competicoes` ADD CONSTRAINT `competicoes_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competicao_atletas` ADD CONSTRAINT `competicao_atletas_competicaoId_fkey` FOREIGN KEY (`competicaoId`) REFERENCES `competicoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `competicao_atletas` ADD CONSTRAINT `competicao_atletas_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_comunicacao` ADD CONSTRAINT `pedidos_comunicacao_solicitanteId_fkey` FOREIGN KEY (`solicitanteId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos_comunicacao` ADD CONSTRAINT `pedidos_comunicacao_aprovadoPorId_fkey` FOREIGN KEY (`aprovadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `push_subscriptions` ADD CONSTRAINT `push_subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
