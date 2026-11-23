-- Imagens e cartazes dos eventos. Só adições: nenhuma tabela ou registo existente é alterado.

-- CreateTable
CREATE TABLE `evento_imagens` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `legenda` VARCHAR(191) NULL,
    `cartaz` BOOLEAN NOT NULL DEFAULT false,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `tamanho` INTEGER NULL,
    `criadoPorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `evento_imagens_eventoId_idx`(`eventoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `evento_imagens` ADD CONSTRAINT `evento_imagens_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `eventos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
