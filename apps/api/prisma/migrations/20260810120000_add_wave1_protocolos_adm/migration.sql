-- AlterTable: students (P02 — estado de inscrição)
ALTER TABLE `students` ADD COLUMN `estadoInscricao` VARCHAR(191) NOT NULL DEFAULT 'COMPLETA';

-- AlterTable: payments (P04 — isenção)
ALTER TABLE `payments`
    ADD COLUMN `isento` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isencaoMotivo` TEXT NULL,
    ADD COLUMN `isencaoAutorizadoPorId` VARCHAR(191) NULL,
    ADD COLUMN `isencaoAutorizadoEm` DATETIME(3) NULL;

-- AlterTable: documents (P02 — validação)
ALTER TABLE `documents`
    ADD COLUMN `validado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `validadoPorId` VARCHAR(191) NULL,
    ADD COLUMN `validadoEm` DATETIME(3) NULL;

-- AlterTable: pedidos_comunicacao (correção transversal — prioridade já enviada pelo frontend)
ALTER TABLE `pedidos_comunicacao` ADD COLUMN `prioridade` VARCHAR(191) NOT NULL DEFAULT 'MEDIA';

-- AlterTable: eventos (P12 — checklist de materiais e relatório pós-evento)
ALTER TABLE `eventos`
    ADD COLUMN `checklistMateriais` TEXT NULL,
    ADD COLUMN `relatorioPos` TEXT NULL;

-- AlterTable: incidentes (P13 — gravidade e testemunhas)
ALTER TABLE `incidentes`
    ADD COLUMN `gravidade` VARCHAR(191) NOT NULL DEFAULT 'BAIXA',
    ADD COLUMN `testemunhas` TEXT NULL;

-- CreateTable: contactos_falta (P03)
CREATE TABLE `contactos_falta` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `motivo` TEXT NOT NULL,
    `faltasConsecutivas` INTEGER NOT NULL,
    `contactadoPorId` VARCHAR(191) NOT NULL,
    `meioContacto` VARCHAR(191) NOT NULL,
    `resultado` TEXT NULL,
    `resolvido` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contactos_falta_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: conferencias_caixa (P04)
CREATE TABLE `conferencias_caixa` (
    `id` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `valorEsperado` DOUBLE NOT NULL,
    `valorContado` DOUBLE NOT NULL,
    `diferenca` DOUBLE NOT NULL,
    `observacoes` TEXT NULL,
    `responsavelId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `conferencias_caixa_unidadeId_idx`(`unidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: transferencias_turma (P05)
CREATE TABLE `transferencias_turma` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `turmaOrigemId` VARCHAR(191) NULL,
    `turmaDestinoId` VARCHAR(191) NOT NULL,
    `motivo` TEXT NOT NULL,
    `autorizadoPorId` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transferencias_turma_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: atendimentos_encarregados (P06)
CREATE TABLE `atendimentos_encarregados` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `unidadeId` VARCHAR(191) NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assunto` VARCHAR(191) NOT NULL,
    `canal` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `resposta` TEXT NULL,
    `prazoResposta` DATETIME(3) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'ABERTO',
    `atendidoPorId` VARCHAR(191) NOT NULL,
    `resolvidoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `atendimentos_encarregados_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: evento_participantes (P12)
CREATE TABLE `evento_participantes` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `nome` VARCHAR(191) NULL,
    `contacto` VARCHAR(191) NULL,
    `presente` BOOLEAN NOT NULL DEFAULT false,
    `pagamentoId` VARCHAR(191) NULL,

    INDEX `evento_participantes_eventoId_idx`(`eventoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: payments.isencaoAutorizadoPorId -> users
ALTER TABLE `payments` ADD CONSTRAINT `payments_isencaoAutorizadoPorId_fkey` FOREIGN KEY (`isencaoAutorizadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: documents.validadoPorId -> users
ALTER TABLE `documents` ADD CONSTRAINT `documents_validadoPorId_fkey` FOREIGN KEY (`validadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: contactos_falta
ALTER TABLE `contactos_falta` ADD CONSTRAINT `contactos_falta_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `contactos_falta` ADD CONSTRAINT `contactos_falta_contactadoPorId_fkey` FOREIGN KEY (`contactadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: conferencias_caixa
ALTER TABLE `conferencias_caixa` ADD CONSTRAINT `conferencias_caixa_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `conferencias_caixa` ADD CONSTRAINT `conferencias_caixa_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: transferencias_turma
ALTER TABLE `transferencias_turma` ADD CONSTRAINT `transferencias_turma_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `transferencias_turma` ADD CONSTRAINT `transferencias_turma_turmaOrigemId_fkey` FOREIGN KEY (`turmaOrigemId`) REFERENCES `classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `transferencias_turma` ADD CONSTRAINT `transferencias_turma_turmaDestinoId_fkey` FOREIGN KEY (`turmaDestinoId`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `transferencias_turma` ADD CONSTRAINT `transferencias_turma_autorizadoPorId_fkey` FOREIGN KEY (`autorizadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: atendimentos_encarregados
ALTER TABLE `atendimentos_encarregados` ADD CONSTRAINT `atendimentos_encarregados_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `atendimentos_encarregados` ADD CONSTRAINT `atendimentos_encarregados_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `parents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `atendimentos_encarregados` ADD CONSTRAINT `atendimentos_encarregados_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `atendimentos_encarregados` ADD CONSTRAINT `atendimentos_encarregados_atendidoPorId_fkey` FOREIGN KEY (`atendidoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: evento_participantes
ALTER TABLE `evento_participantes` ADD CONSTRAINT `evento_participantes_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `eventos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `evento_participantes` ADD CONSTRAINT `evento_participantes_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `evento_participantes` ADD CONSTRAINT `evento_participantes_pagamentoId_fkey` FOREIGN KEY (`pagamentoId`) REFERENCES `payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
