-- Migração aditiva: não remove nem altera colunas existentes.
-- Os registos anteriores ficam com automatica = false (eram todos manuais).
-- AlterTable
ALTER TABLE `registos_entrada_saida` ADD COLUMN `automatica` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `registos_entrada_saida_studentId_dataHora_idx` ON `registos_entrada_saida`(`studentId`, `dataHora`);
