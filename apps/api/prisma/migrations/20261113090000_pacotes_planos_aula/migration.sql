-- Migração aditiva: cria pacotes e planos de aula e acrescenta students.pacoteId (opcional).
-- Não remove nem altera colunas existentes; os atletas actuais ficam sem pacote (NULL).
-- AlterTable
ALTER TABLE `students` ADD COLUMN `pacoteId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `planos_aula` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NULL,
    `semanaInicio` DATE NOT NULL,
    `nivel` VARCHAR(191) NULL,
    `objetivoSemana` TEXT NULL,
    `conteudo` LONGTEXT NOT NULL,
    `observacoes` TEXT NULL,
    `criadoPorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `planos_aula_instructorId_idx`(`instructorId`),
    UNIQUE INDEX `planos_aula_classId_semanaInicio_key`(`classId`, `semanaInicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pacotes` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `preco` DOUBLE NOT NULL,
    `aulasPorSemana` INTEGER NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoPorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pacotes_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `students_pacoteId_idx` ON `students`(`pacoteId`);

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_pacoteId_fkey` FOREIGN KEY (`pacoteId`) REFERENCES `pacotes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planos_aula` ADD CONSTRAINT `planos_aula_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `planos_aula` ADD CONSTRAINT `planos_aula_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

