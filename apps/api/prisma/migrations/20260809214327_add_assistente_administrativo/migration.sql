-- CreateTable
CREATE TABLE `mensagens_whatsapp` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `criadoPorId` VARCHAR(191) NULL,
    `enviadoPorId` VARCHAR(191) NULL,
    `enviadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mensagens_whatsapp_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `links_partilha` (
    `id` VARCHAR(191) NOT NULL,
    `chave` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `links_partilha_chave_key`(`chave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mensagens_whatsapp` ADD CONSTRAINT `mensagens_whatsapp_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagens_whatsapp` ADD CONSTRAINT `mensagens_whatsapp_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: Central de Partilha (links geridos pelo Assistente Administrativo)
INSERT INTO `links_partilha` (`id`, `chave`, `label`, `url`, `updatedAt`, `createdAt`) VALUES
    (UUID(), 'NEWSLETTER', 'Newsletter Mastchieve', 'https://mastchieve.com/newsletter', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (UUID(), 'PROGRAMA_ANUAL', 'Programa Anual', 'https://mastchieve.com/programa-anual', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (UUID(), 'OPEN_DAY', 'Open Day', 'https://mastchieve.com/open-day', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (UUID(), 'TREINADOR_CLIENTE', 'Treinador do Cliente', 'https://mastchieve.com/treinador-cliente', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (UUID(), 'VIDEO_INDUCAO', 'Vídeo de Indução Mastchieve', 'https://mastchieve.com/video-inducao', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
