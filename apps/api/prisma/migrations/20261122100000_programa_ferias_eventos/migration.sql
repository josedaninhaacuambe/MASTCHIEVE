-- Programa de férias nos Eventos: período, pacotes por evento e validação das inscrições.
-- Só adições: nenhuma coluna ou registo existente é alterado ou removido.

-- AlterTable
ALTER TABLE `eventos` ADD COLUMN `dataFim` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `evento_pacotes` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `preco` DOUBLE NOT NULL,
    `dias` INTEGER NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `evento_pacotes_eventoId_idx`(`eventoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `evento_participantes`
    ADD COLUMN `eventoPacoteId` VARCHAR(191) NULL,
    ADD COLUMN `pacoteNome` VARCHAR(191) NULL,
    ADD COLUMN `pacotePreco` DOUBLE NULL,
    ADD COLUMN `dataInicioPretendida` DATE NULL,
    ADD COLUMN `dataFimPrevista` DATE NULL,
    ADD COLUMN `validadoEm` DATETIME(3) NULL,
    ADD COLUMN `validadoPorId` VARCHAR(191) NULL,
    ADD COLUMN `motivoRejeicao` TEXT NULL;

-- CreateIndex
CREATE INDEX `evento_participantes_eventoPacoteId_idx` ON `evento_participantes`(`eventoPacoteId`);

-- AddForeignKey
ALTER TABLE `evento_pacotes` ADD CONSTRAINT `evento_pacotes_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `eventos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evento_participantes` ADD CONSTRAINT `evento_participantes_eventoPacoteId_fkey` FOREIGN KEY (`eventoPacoteId`) REFERENCES `evento_pacotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
