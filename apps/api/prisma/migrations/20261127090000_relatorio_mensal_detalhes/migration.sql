-- Relatório mensal: detalhes do mês (entradas, feedbacks, avaliações, resumo) e data da última regeneração.
-- Só adições: duas colunas opcionais. Nenhum registo existente é alterado.

-- AlterTable
ALTER TABLE `relatorios_mensais` ADD COLUMN `detalhes` TEXT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NULL;
