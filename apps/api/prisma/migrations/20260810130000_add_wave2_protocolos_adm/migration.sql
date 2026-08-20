-- AlterTable: documents (P14 — arquivo documental)
ALTER TABLE `documents`
    ADD COLUMN `categoria` VARCHAR(191) NOT NULL DEFAULT 'OUTRO',
    ADD COLUMN `unidadeId` VARCHAR(191) NULL,
    ADD COLUMN `confidencial` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `retencaoAte` DATETIME(3) NULL;

-- CreateTable: atendimentos_recepcao (P01)
CREATE TABLE `atendimentos_recepcao` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `contacto` VARCHAR(191) NULL,
    `tipoVisitante` VARCHAR(191) NOT NULL DEFAULT 'VISITANTE',
    `motivo` TEXT NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `encaminhadoParaId` VARCHAR(191) NULL,
    `prazo` DATETIME(3) NULL,
    `desfecho` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'ABERTO',
    `atendidoPorId` VARCHAR(191) NOT NULL,
    `resolvidoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `atendimentos_recepcao_estado_idx`(`estado`),
    INDEX `atendimentos_recepcao_unidadeId_idx`(`unidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: itens_inventario (P08)
CREATE TABLE `itens_inventario` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL DEFAULT 'OUTRO',
    `unidadeId` VARCHAR(191) NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 0,
    `quantidadeMin` INTEGER NOT NULL DEFAULT 0,
    `unidadeMedida` VARCHAR(191) NOT NULL DEFAULT 'UN',
    `localizacao` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `itens_inventario_unidadeId_idx`(`unidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: movimentos_inventario (P08)
CREATE TABLE `movimentos_inventario` (
    `id` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `motivo` TEXT NULL,
    `responsavelId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `movimentos_inventario_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: pessoas_autorizadas (P09)
CREATE TABLE `pessoas_autorizadas` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `parentesco` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `documentoId` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pessoas_autorizadas_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: registos_entrada_saida (P09)
CREATE TABLE `registos_entrada_saida` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `dataHora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pessoaAutorizadaId` VARCHAR(191) NULL,
    `justificativa` TEXT NULL,
    `registadoPorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `registos_entrada_saida_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: reclamacoes (P10)
CREATE TABLE `reclamacoes` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL DEFAULT 'OUTRO',
    `studentId` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `nome` VARCHAR(191) NULL,
    `contacto` VARCHAR(191) NULL,
    `unidadeId` VARCHAR(191) NULL,
    `descricao` TEXT NOT NULL,
    `prazoResposta` DATETIME(3) NULL,
    `resposta` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'ABERTA',
    `registadoPorId` VARCHAR(191) NOT NULL,
    `resolvidoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reclamacoes_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: relatorios_mensais (P15)
CREATE TABLE `relatorios_mensais` (
    `id` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `mes` INTEGER NOT NULL,
    `ano` INTEGER NOT NULL,
    `totalAlunos` INTEGER NOT NULL,
    `novasInscricoes` INTEGER NOT NULL,
    `taxaPresencaMedia` DOUBLE NOT NULL,
    `receitaTotal` DOUBLE NOT NULL,
    `pagamentosEmAtraso` INTEGER NOT NULL,
    `totalIncidentes` INTEGER NOT NULL,
    `incidentesGraves` INTEGER NOT NULL,
    `totalReclamacoes` INTEGER NOT NULL,
    `totalEventos` INTEGER NOT NULL,
    `itensStockBaixo` INTEGER NOT NULL,
    `geradoPorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `relatorios_mensais_unidadeId_mes_ano_key`(`unidadeId`, `mes`, `ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: rotinas_diarias (P16)
CREATE TABLE `rotinas_diarias` (
    `id` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` VARCHAR(191) NOT NULL,
    `checklist` TEXT NOT NULL,
    `concluido` BOOLEAN NOT NULL DEFAULT false,
    `concluidoPorId` VARCHAR(191) NULL,
    `concluidoEm` DATETIME(3) NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `rotinas_diarias_unidadeId_idx`(`unidadeId`),
    UNIQUE INDEX `rotinas_diarias_unidadeId_data_tipo_key`(`unidadeId`, `data`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: documents.unidadeId -> unidades
ALTER TABLE `documents` ADD CONSTRAINT `documents_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: atendimentos_recepcao
ALTER TABLE `atendimentos_recepcao` ADD CONSTRAINT `atendimentos_recepcao_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `atendimentos_recepcao` ADD CONSTRAINT `atendimentos_recepcao_encaminhadoParaId_fkey` FOREIGN KEY (`encaminhadoParaId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `atendimentos_recepcao` ADD CONSTRAINT `atendimentos_recepcao_atendidoPorId_fkey` FOREIGN KEY (`atendidoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: itens_inventario
ALTER TABLE `itens_inventario` ADD CONSTRAINT `itens_inventario_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: movimentos_inventario
ALTER TABLE `movimentos_inventario` ADD CONSTRAINT `movimentos_inventario_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `itens_inventario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `movimentos_inventario` ADD CONSTRAINT `movimentos_inventario_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: pessoas_autorizadas
ALTER TABLE `pessoas_autorizadas` ADD CONSTRAINT `pessoas_autorizadas_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: registos_entrada_saida
ALTER TABLE `registos_entrada_saida` ADD CONSTRAINT `registos_entrada_saida_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `registos_entrada_saida` ADD CONSTRAINT `registos_entrada_saida_pessoaAutorizadaId_fkey` FOREIGN KEY (`pessoaAutorizadaId`) REFERENCES `pessoas_autorizadas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `registos_entrada_saida` ADD CONSTRAINT `registos_entrada_saida_registadoPorId_fkey` FOREIGN KEY (`registadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: reclamacoes
ALTER TABLE `reclamacoes` ADD CONSTRAINT `reclamacoes_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reclamacoes` ADD CONSTRAINT `reclamacoes_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `parents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reclamacoes` ADD CONSTRAINT `reclamacoes_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reclamacoes` ADD CONSTRAINT `reclamacoes_registadoPorId_fkey` FOREIGN KEY (`registadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: relatorios_mensais
ALTER TABLE `relatorios_mensais` ADD CONSTRAINT `relatorios_mensais_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `relatorios_mensais` ADD CONSTRAINT `relatorios_mensais_geradoPorId_fkey` FOREIGN KEY (`geradoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: rotinas_diarias
ALTER TABLE `rotinas_diarias` ADD CONSTRAINT `rotinas_diarias_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `rotinas_diarias` ADD CONSTRAINT `rotinas_diarias_concluidoPorId_fkey` FOREIGN KEY (`concluidoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
