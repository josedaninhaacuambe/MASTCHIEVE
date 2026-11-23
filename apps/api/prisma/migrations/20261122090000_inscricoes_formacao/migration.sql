-- Migração aditiva: vagas/local nas formações e campos de gestão das inscrições.
-- Não remove nem altera colunas existentes; as inscrições actuais mantêm o estado.
-- AlterTable
ALTER TABLE `rh_formacoes` ADD COLUMN `vagas` INTEGER NULL,
    ADD COLUMN `local` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `rh_funcionario_formacoes` ADD COLUMN `observacoes` TEXT NULL,
    ADD COLUMN `inscritoPorId` VARCHAR(191) NULL,
    ADD COLUMN `canceladoEm` DATETIME(3) NULL,
    ADD COLUMN `canceladoPorId` VARCHAR(191) NULL,
    ADD COLUMN `motivoCancelamento` TEXT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `rh_funcionario_formacoes_funcionarioId_idx` ON `rh_funcionario_formacoes`(`funcionarioId`);

-- CreateIndex
CREATE INDEX `rh_funcionario_formacoes_estado_idx` ON `rh_funcionario_formacoes`(`estado`);
