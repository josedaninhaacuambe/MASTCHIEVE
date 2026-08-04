-- CreateTable
CREATE TABLE `avaliacoes` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `sessaoAgendadaId` VARCHAR(191) NULL,
    `classSessionId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `studentFaseId` VARCHAR(191) NOT NULL,
    `pontuacoes` TEXT NOT NULL,
    `soma` INTEGER NOT NULL,
    `totalMinimoSnapshot` INTEGER NOT NULL,
    `notaGlobal` DOUBLE NOT NULL,
    `aprovado` BOOLEAN NOT NULL,
    `motivoReprovacao` TEXT NULL,
    `observacoes` TEXT NULL,
    `avaliadoPorId` VARCHAR(191) NULL,
    `avaliadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `avaliacoes_studentId_idx`(`studentId`),
    INDEX `avaliacoes_studentFaseId_idx`(`studentFaseId`),
    INDEX `avaliacoes_tipo_idx`(`tipo`),
    UNIQUE INDEX `avaliacoes_sessaoAgendadaId_studentId_key`(`sessaoAgendadaId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrar histórico: avaliacoes_agendadas_resultados -> avaliacoes (tipo=AGENDADA), 1:1 sem perda de dados
INSERT INTO `avaliacoes` (`id`, `tipo`, `sessaoAgendadaId`, `classSessionId`, `studentId`, `studentFaseId`, `pontuacoes`, `soma`, `totalMinimoSnapshot`, `notaGlobal`, `aprovado`, `motivoReprovacao`, `observacoes`, `avaliadoPorId`, `avaliadoEm`)
SELECT
    `id`,
    'AGENDADA',
    `sessaoId`,
    NULL,
    `studentId`,
    `studentFaseId`,
    `pontuacoes`,
    `soma`,
    `totalMinimoSnapshot`,
    ROUND((`soma` / (GREATEST(JSON_LENGTH(`pontuacoes`), 1) * 5)) * 10, 2),
    `aprovado`,
    `motivoReprovacao`,
    NULL,
    `avaliadoPorId`,
    `avaliadoEm`
FROM `avaliacoes_agendadas_resultados`;

-- AlterTable (não mexe em performance_records — dados legados mantêm-se intactos)
ALTER TABLE `feedbacks` ADD COLUMN `avaliacaoId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `feedbacks_avaliacaoId_key` ON `feedbacks`(`avaliacaoId`);

-- AddForeignKey
ALTER TABLE `avaliacoes` ADD CONSTRAINT `avaliacoes_sessaoAgendadaId_fkey` FOREIGN KEY (`sessaoAgendadaId`) REFERENCES `avaliacoes_agendadas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes` ADD CONSTRAINT `avaliacoes_classSessionId_fkey` FOREIGN KEY (`classSessionId`) REFERENCES `class_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes` ADD CONSTRAINT `avaliacoes_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes` ADD CONSTRAINT `avaliacoes_studentFaseId_fkey` FOREIGN KEY (`studentFaseId`) REFERENCES `student_fases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes` ADD CONSTRAINT `avaliacoes_avaliadoPorId_fkey` FOREIGN KEY (`avaliadoPorId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_avaliacaoId_fkey` FOREIGN KEY (`avaliacaoId`) REFERENCES `avaliacoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE `avaliacoes_agendadas_resultados` DROP FOREIGN KEY `avaliacoes_agendadas_resultados_sessaoId_fkey`;

-- DropForeignKey
ALTER TABLE `avaliacoes_agendadas_resultados` DROP FOREIGN KEY `avaliacoes_agendadas_resultados_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `avaliacoes_agendadas_resultados` DROP FOREIGN KEY `avaliacoes_agendadas_resultados_studentFaseId_fkey`;

-- DropForeignKey
ALTER TABLE `avaliacoes_agendadas_resultados` DROP FOREIGN KEY `avaliacoes_agendadas_resultados_avaliadoPorId_fkey`;

-- DropTable (dados já copiados para `avaliacoes`; `performance_records` não é tocada)
DROP TABLE `avaliacoes_agendadas_resultados`;
