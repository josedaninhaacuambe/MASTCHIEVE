-- CreateTable
CREATE TABLE `rh_dispositivos_quiosque` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NOT NULL,
    `chaveHash` VARCHAR(255) NOT NULL,
    `ultimoAcesso` DATETIME(3) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoPorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rh_dispositivos_quiosque_unidadeId_idx`(`unidadeId`),
    INDEX `rh_dispositivos_quiosque_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_credenciais_biometricas` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `dispositivoId` VARCHAR(191) NULL,
    `credentialId` VARCHAR(512) NULL,
    `publicKey` TEXT NULL,
    `counter` BIGINT NULL DEFAULT 0,
    `transports` VARCHAR(191) NULL,
    `deviceLabel` VARCHAR(191) NULL,
    `fabricante` VARCHAR(191) NULL,
    `templateData` LONGBLOB NULL,
    `templateFormato` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `registadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ultimaUtilizacao` DATETIME(3) NULL,

    UNIQUE INDEX `rh_credenciais_biometricas_credentialId_key`(`credentialId`),
    INDEX `rh_credenciais_biometricas_funcionarioId_idx`(`funcionarioId`),
    INDEX `rh_credenciais_biometricas_tipo_idx`(`tipo`),
    INDEX `rh_credenciais_biometricas_dispositivoId_idx`(`dispositivoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_presencas_biometricas` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `dispositivoId` VARCHAR(191) NULL,
    `unidadeId` VARCHAR(191) NULL,
    `escalaId` VARCHAR(191) NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `metodoVerificacao` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lancadoManualmente` BOOLEAN NOT NULL DEFAULT false,
    `responsavelId` VARCHAR(191) NULL,
    `observacao` TEXT NULL,

    INDEX `rh_presencas_biometricas_funcionarioId_idx`(`funcionarioId`),
    INDEX `rh_presencas_biometricas_dispositivoId_idx`(`dispositivoId`),
    INDEX `rh_presencas_biometricas_timestamp_idx`(`timestamp`),
    INDEX `rh_presencas_biometricas_funcionarioId_timestamp_idx`(`funcionarioId`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rh_dispositivos_quiosque` ADD CONSTRAINT `rh_dispositivos_quiosque_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_dispositivos_quiosque` ADD CONSTRAINT `rh_dispositivos_quiosque_criadoPorId_fkey` FOREIGN KEY (`criadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_credenciais_biometricas` ADD CONSTRAINT `rh_credenciais_biometricas_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_credenciais_biometricas` ADD CONSTRAINT `rh_credenciais_biometricas_dispositivoId_fkey` FOREIGN KEY (`dispositivoId`) REFERENCES `rh_dispositivos_quiosque`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_presencas_biometricas` ADD CONSTRAINT `rh_presencas_biometricas_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_presencas_biometricas` ADD CONSTRAINT `rh_presencas_biometricas_dispositivoId_fkey` FOREIGN KEY (`dispositivoId`) REFERENCES `rh_dispositivos_quiosque`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_presencas_biometricas` ADD CONSTRAINT `rh_presencas_biometricas_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_presencas_biometricas` ADD CONSTRAINT `rh_presencas_biometricas_escalaId_fkey` FOREIGN KEY (`escalaId`) REFERENCES `rh_escalas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_presencas_biometricas` ADD CONSTRAINT `rh_presencas_biometricas_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

