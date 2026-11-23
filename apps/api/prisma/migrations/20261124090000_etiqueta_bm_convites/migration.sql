-- Etiqueta BM (Banco de Moçambique), trabalhador do BM e convites de acesso.
-- Só adições: colunas opcionais e uma tabela nova. Nenhum registo existente é alterado.

-- AlterTable
ALTER TABLE `students` ADD COLUMN `etiqueta` VARCHAR(40) NULL,
    ADD COLUMN `trabalhadorBm` VARCHAR(120) NULL;

-- CreateIndex
CREATE INDEX `students_etiqueta_idx` ON `students`(`etiqueta`);

-- CreateTable
CREATE TABLE `convites_acesso` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(64) NOT NULL,
    `expiraEm` DATETIME(3) NOT NULL,
    `usadoEm` DATETIME(3) NULL,
    `criadoPorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `convites_acesso_tokenHash_key`(`tokenHash`),
    INDEX `convites_acesso_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `convites_acesso` ADD CONSTRAINT `convites_acesso_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
