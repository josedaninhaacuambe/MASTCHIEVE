-- Migração aditiva: não remove nem altera colunas existentes.
-- AlterTable
ALTER TABLE `attendances` ADD COLUMN `horaEntrada` DATETIME(3) NULL,
    ADD COLUMN `horaSaida` DATETIME(3) NULL,
    ADD COLUMN `isConvidado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `turmaOrigemId` VARCHAR(191) NULL,
    ADD COLUMN `unidadeId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `eventos` ADD COLUMN `descricao` TEXT NULL,
    ADD COLUMN `formularioCampos` TEXT NULL,
    ADD COLUMN `formularioTipo` VARCHAR(191) NOT NULL DEFAULT 'INDIVIDUAL',
    ADD COLUMN `hora` VARCHAR(191) NULL,
    ADD COLUMN `inscricoesAbertas` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `linkInscricaoAtleta` VARCHAR(191) NULL,
    ADD COLUMN `local` VARCHAR(191) NULL,
    ADD COLUMN `tokenPublico` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `evento_participantes` ADD COLUMN `autorizacaoImagem` BOOLEAN NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `dadosFormulario` TEXT NULL,
    ADD COLUMN `dataNascimento` DATETIME(3) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'PRE_INSCRITO',
    ADD COLUMN `inscricaoId` VARCHAR(191) NULL,
    ADD COLUMN `leadId` VARCHAR(191) NULL,
    ADD COLUMN `origem` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN `submetidoEm` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `class_instructors` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `papel` VARCHAR(191) NOT NULL DEFAULT 'AUXILIAR',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `class_instructors_instructorId_idx`(`instructorId`),
    UNIQUE INDEX `class_instructors_classId_instructorId_key`(`classId`, `instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_instructors` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `data` DATETIME(3) NOT NULL,
    `registadoPorId` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `session_instructors_instructorId_idx`(`instructorId`),
    INDEX `session_instructors_data_idx`(`data`),
    UNIQUE INDEX `session_instructors_sessionId_instructorId_key`(`sessionId`, `instructorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evento_inscricoes` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'INDIVIDUAL',
    `responsavelNome` VARCHAR(191) NOT NULL,
    `contacto` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `dados` TEXT NULL,
    `declaracaoAceite` BOOLEAN NOT NULL DEFAULT false,
    `submetidoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `evento_inscricoes_eventoId_idx`(`eventoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evento_comunicacoes` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `galeriaUrl` VARCHAR(191) NULL,
    `proximasActividades` TEXT NULL,
    `linkInscricao` VARCHAR(191) NULL,
    `canais` VARCHAR(191) NOT NULL,
    `filtroEstados` TEXT NULL,
    `totalDestinatarios` INTEGER NOT NULL DEFAULT 0,
    `totalWhatsapp` INTEGER NOT NULL DEFAULT 0,
    `totalEmail` INTEGER NOT NULL DEFAULT 0,
    `totalSemContacto` INTEGER NOT NULL DEFAULT 0,
    `criadoPorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `evento_comunicacoes_eventoId_idx`(`eventoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evento_comunicacao_envios` (
    `id` VARCHAR(191) NOT NULL,
    `comunicacaoId` VARCHAR(191) NOT NULL,
    `participanteId` VARCHAR(191) NOT NULL,
    `canal` VARCHAR(191) NOT NULL,
    `destino` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL,
    `mensagemWhatsappId` VARCHAR(191) NULL,
    `erro` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `evento_comunicacao_envios_comunicacaoId_idx`(`comunicacaoId`),
    INDEX `evento_comunicacao_envios_participanteId_idx`(`participanteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `attendances_isConvidado_idx` ON `attendances`(`isConvidado`);

-- CreateIndex
CREATE UNIQUE INDEX `eventos_tokenPublico_key` ON `eventos`(`tokenPublico`);

-- CreateIndex
CREATE INDEX `evento_participantes_estado_idx` ON `evento_participantes`(`estado`);

-- CreateIndex
CREATE INDEX `evento_participantes_inscricaoId_idx` ON `evento_participantes`(`inscricaoId`);

-- AddForeignKey
ALTER TABLE `class_instructors` ADD CONSTRAINT `class_instructors_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_instructors` ADD CONSTRAINT `class_instructors_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_instructors` ADD CONSTRAINT `session_instructors_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `class_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_instructors` ADD CONSTRAINT `session_instructors_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_instructors` ADD CONSTRAINT `session_instructors_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_turmaOrigemId_fkey` FOREIGN KEY (`turmaOrigemId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evento_inscricoes` ADD CONSTRAINT `evento_inscricoes_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `eventos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evento_comunicacoes` ADD CONSTRAINT `evento_comunicacoes_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `eventos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evento_comunicacao_envios` ADD CONSTRAINT `evento_comunicacao_envios_comunicacaoId_fkey` FOREIGN KEY (`comunicacaoId`) REFERENCES `evento_comunicacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evento_comunicacao_envios` ADD CONSTRAINT `evento_comunicacao_envios_participanteId_fkey` FOREIGN KEY (`participanteId`) REFERENCES `evento_participantes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evento_participantes` ADD CONSTRAINT `evento_participantes_inscricaoId_fkey` FOREIGN KEY (`inscricaoId`) REFERENCES `evento_inscricoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evento_participantes` ADD CONSTRAINT `evento_participantes_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- ─── Backfill (preserva dados existentes) ──────────────────────────────────

-- Instrutor actual de cada turma passa a constar também como PRINCIPAL na relação M:N.
INSERT INTO `class_instructors` (`id`, `classId`, `instructorId`, `papel`, `criadoEm`)
SELECT UUID(), c.`id`, c.`instructorId`, 'PRINCIPAL', CURRENT_TIMESTAMP(3)
FROM `classes` c
WHERE NOT EXISTS (
  SELECT 1 FROM `class_instructors` ci WHERE ci.`classId` = c.`id` AND ci.`instructorId` = c.`instructorId`
);

-- Instrutores que já marcaram presenças ficam registados como tendo leccionado a sessão.
INSERT INTO `session_instructors` (`id`, `sessionId`, `instructorId`, `unidadeId`, `data`, `criadoEm`)
SELECT UUID(), x.`sessionId`, x.`instructorId`, c.`unidadeId`, s.`sessionDate`, CURRENT_TIMESTAMP(3)
FROM (SELECT DISTINCT a.`sessionId`, a.`instructorId` FROM `attendances` a) x
JOIN `class_sessions` s ON s.`id` = x.`sessionId`
JOIN `classes` c ON c.`id` = s.`classId`;

-- Participantes já existentes foram adicionados pelo staff: CONFIRMADO, ou PRESENTE se marcado.
UPDATE `evento_participantes` SET `estado` = IF(`presente` = 1, 'PRESENTE', 'CONFIRMADO');
