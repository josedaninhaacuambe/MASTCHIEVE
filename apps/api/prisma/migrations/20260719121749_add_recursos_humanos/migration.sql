-- CreateTable
CREATE TABLE `funcionarios` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NULL,
    `numeroFuncionario` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `biNumero` VARCHAR(191) NULL,
    `cargo` VARCHAR(191) NOT NULL,
    `departamento` VARCHAR(191) NOT NULL DEFAULT 'OPERACOES',
    `dataAdmissao` DATETIME(3) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'EM_RECRUTAMENTO',
    `contactoEmergencia` VARCHAR(191) NULL,
    `telefoneEmergencia` VARCHAR(191) NULL,
    `salarioBase` DOUBLE NULL,
    `unidadeId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `funcionarios_userId_key`(`userId`),
    UNIQUE INDEX `funcionarios_instructorId_key`(`instructorId`),
    UNIQUE INDEX `funcionarios_numeroFuncionario_key`(`numeroFuncionario`),
    INDEX `funcionarios_estado_idx`(`estado`),
    INDEX `funcionarios_cargo_idx`(`cargo`),
    INDEX `funcionarios_unidadeId_idx`(`unidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_vagas` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `cargo` VARCHAR(191) NOT NULL,
    `departamento` VARCHAR(191) NOT NULL DEFAULT 'OPERACOES',
    `unidadeId` VARCHAR(191) NULL,
    `descricao` TEXT NOT NULL,
    `requisitos` TEXT NULL,
    `numeroVagas` INTEGER NOT NULL DEFAULT 1,
    `orcamentoEstimado` DOUBLE NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'RASCUNHO',
    `solicitanteId` VARCHAR(191) NOT NULL,
    `aprovadoPorId` VARCHAR(191) NULL,
    `aprovadoEm` DATETIME(3) NULL,
    `motivoRejeicao` TEXT NULL,
    `publicadaEm` DATETIME(3) NULL,
    `encerradaEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rh_vagas_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_candidaturas` (
    `id` VARCHAR(191) NOT NULL,
    `vagaId` VARCHAR(191) NOT NULL,
    `nomeCandidato` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `cvUrl` VARCHAR(191) NULL,
    `cartaMotivacao` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'RECEBIDA',
    `notaEntrevista` DOUBLE NULL,
    `notaTestePratico` DOUBLE NULL,
    `observacoesRH` TEXT NULL,
    `avaliadoPorId` VARCHAR(191) NULL,
    `aprovadoPorId` VARCHAR(191) NULL,
    `aprovadoEm` DATETIME(3) NULL,
    `motivoRejeicao` TEXT NULL,
    `funcionarioId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rh_candidaturas_funcionarioId_key`(`funcionarioId`),
    INDEX `rh_candidaturas_estado_idx`(`estado`),
    INDEX `rh_candidaturas_vagaId_idx`(`vagaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_contratos` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `cargo` VARCHAR(191) NOT NULL,
    `salarioBase` DOUBLE NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NULL,
    `clausulas` TEXT NULL,
    `documentoUrl` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'RASCUNHO',
    `elaboradoPorId` VARCHAR(191) NOT NULL,
    `assinadoPorId` VARCHAR(191) NULL,
    `assinadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rh_contratos_estado_idx`(`estado`),
    INDEX `rh_contratos_funcionarioId_idx`(`funcionarioId`),
    INDEX `rh_contratos_dataFim_idx`(`dataFim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_escalas` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `unidadeId` VARCHAR(191) NULL,
    `classId` VARCHAR(191) NULL,
    `data` DATETIME(3) NOT NULL,
    `turno` VARCHAR(191) NOT NULL,
    `horaInicio` VARCHAR(191) NOT NULL,
    `horaFim` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'AULA',
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PLANEADA',
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rh_escalas_funcionarioId_idx`(`funcionarioId`),
    INDEX `rh_escalas_data_idx`(`data`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_certificacoes` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `numeroDocumento` VARCHAR(191) NULL,
    `entidadeEmissora` VARCHAR(191) NULL,
    `dataEmissao` DATETIME(3) NULL,
    `dataValidade` DATETIME(3) NULL,
    `documentoUrl` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'ATIVA',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rh_certificacoes_funcionarioId_idx`(`funcionarioId`),
    INDEX `rh_certificacoes_dataValidade_idx`(`dataValidade`),
    INDEX `rh_certificacoes_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_avaliacoes_desempenho` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `avaliadorId` VARCHAR(191) NOT NULL,
    `periodo` VARCHAR(191) NOT NULL,
    `dataAvaliacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataLimite` DATETIME(3) NULL,
    `pontualidade` INTEGER NULL,
    `competenciaTecnica` INTEGER NULL,
    `trabalhoEquipa` INTEGER NULL,
    `atendimento` INTEGER NULL,
    `pontuacaoGeral` DOUBLE NULL,
    `pontosFortes` TEXT NULL,
    `areasMelhoria` TEXT NULL,
    `planoDesenvolvimento` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rh_avaliacoes_desempenho_funcionarioId_idx`(`funcionarioId`),
    INDEX `rh_avaliacoes_desempenho_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_ferias_faltas` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL,
    `dataFim` DATETIME(3) NOT NULL,
    `diasSolicitados` INTEGER NOT NULL,
    `motivo` TEXT NULL,
    `documentoUrl` VARCHAR(191) NULL,
    `excepcional` BOOLEAN NOT NULL DEFAULT false,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `solicitanteId` VARCHAR(191) NOT NULL,
    `aprovadoPorId` VARCHAR(191) NULL,
    `aprovadoEm` DATETIME(3) NULL,
    `motivoRejeicao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rh_ferias_faltas_estado_idx`(`estado`),
    INDEX `rh_ferias_faltas_funcionarioId_idx`(`funcionarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_folha_pagamento` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `mes` INTEGER NOT NULL,
    `ano` INTEGER NOT NULL,
    `salarioBase` DOUBLE NOT NULL,
    `premios` DOUBLE NOT NULL DEFAULT 0,
    `descontos` DOUBLE NOT NULL DEFAULT 0,
    `horasExtras` DOUBLE NOT NULL DEFAULT 0,
    `valorLiquido` DOUBLE NOT NULL,
    `detalhes` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'RASCUNHO',
    `processadoPorId` VARCHAR(191) NOT NULL,
    `aprovadoPorId` VARCHAR(191) NULL,
    `aprovadoEm` DATETIME(3) NULL,
    `pagoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rh_folha_pagamento_estado_idx`(`estado`),
    UNIQUE INDEX `rh_folha_pagamento_funcionarioId_mes_ano_key`(`funcionarioId`, `mes`, `ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_ocorrencias_disciplinares` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` VARCHAR(191) NOT NULL,
    `gravidade` VARCHAR(191) NOT NULL DEFAULT 'LEVE',
    `descricao` TEXT NOT NULL,
    `medidaAplicada` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'REGISTADA',
    `decisaoFinal` VARCHAR(191) NULL,
    `registadoPorId` VARCHAR(191) NOT NULL,
    `decididoPorId` VARCHAR(191) NULL,
    `decididoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rh_ocorrencias_disciplinares_gravidade_idx`(`gravidade`),
    INDEX `rh_ocorrencias_disciplinares_estado_idx`(`estado`),
    INDEX `rh_ocorrencias_disciplinares_funcionarioId_idx`(`funcionarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_formacoes` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `custoEstimado` DOUBLE NULL,
    `dataInicio` DATETIME(3) NULL,
    `dataFim` DATETIME(3) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PROPOSTA',
    `propostoPorId` VARCHAR(191) NOT NULL,
    `aprovadoPorId` VARCHAR(191) NULL,
    `aprovadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `rh_formacoes_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_funcionario_formacoes` (
    `id` VARCHAR(191) NOT NULL,
    `formacaoId` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'INSCRITO',
    `notaFinal` DOUBLE NULL,
    `certificadoUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rh_funcionario_formacoes_formacaoId_funcionarioId_key`(`formacaoId`, `funcionarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_documentos` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NULL,
    `candidaturaId` VARCHAR(191) NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `size` INTEGER NULL,
    `validado` BOOLEAN NOT NULL DEFAULT false,
    `validadoPorId` VARCHAR(191) NULL,
    `validadoEm` DATETIME(3) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `rh_documentos_funcionarioId_idx`(`funcionarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rh_desligamentos` (
    `id` VARCHAR(191) NOT NULL,
    `funcionarioId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `motivo` TEXT NULL,
    `dataInicioProcesso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataSaida` DATETIME(3) NULL,
    `avisoPrevioDias` INTEGER NULL,
    `valorAcertoContas` DOUBLE NULL,
    `detalhesAcerto` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'INICIADO',
    `iniciadoPorId` VARCHAR(191) NOT NULL,
    `aprovadoPorId` VARCHAR(191) NULL,
    `aprovadoEm` DATETIME(3) NULL,
    `acessosDesativadosEm` DATETIME(3) NULL,
    `arquivadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rh_desligamentos_funcionarioId_key`(`funcionarioId`),
    INDEX `rh_desligamentos_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `funcionarios` ADD CONSTRAINT `funcionarios_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcionarios` ADD CONSTRAINT `funcionarios_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcionarios` ADD CONSTRAINT `funcionarios_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_vagas` ADD CONSTRAINT `rh_vagas_solicitanteId_fkey` FOREIGN KEY (`solicitanteId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_vagas` ADD CONSTRAINT `rh_vagas_aprovadoPorId_fkey` FOREIGN KEY (`aprovadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_vagas` ADD CONSTRAINT `rh_vagas_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_candidaturas` ADD CONSTRAINT `rh_candidaturas_vagaId_fkey` FOREIGN KEY (`vagaId`) REFERENCES `rh_vagas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_candidaturas` ADD CONSTRAINT `rh_candidaturas_avaliadoPorId_fkey` FOREIGN KEY (`avaliadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_candidaturas` ADD CONSTRAINT `rh_candidaturas_aprovadoPorId_fkey` FOREIGN KEY (`aprovadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_candidaturas` ADD CONSTRAINT `rh_candidaturas_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_contratos` ADD CONSTRAINT `rh_contratos_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_contratos` ADD CONSTRAINT `rh_contratos_elaboradoPorId_fkey` FOREIGN KEY (`elaboradoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_contratos` ADD CONSTRAINT `rh_contratos_assinadoPorId_fkey` FOREIGN KEY (`assinadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_escalas` ADD CONSTRAINT `rh_escalas_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_escalas` ADD CONSTRAINT `rh_escalas_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `unidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_certificacoes` ADD CONSTRAINT `rh_certificacoes_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_avaliacoes_desempenho` ADD CONSTRAINT `rh_avaliacoes_desempenho_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_avaliacoes_desempenho` ADD CONSTRAINT `rh_avaliacoes_desempenho_avaliadorId_fkey` FOREIGN KEY (`avaliadorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_ferias_faltas` ADD CONSTRAINT `rh_ferias_faltas_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_ferias_faltas` ADD CONSTRAINT `rh_ferias_faltas_solicitanteId_fkey` FOREIGN KEY (`solicitanteId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_ferias_faltas` ADD CONSTRAINT `rh_ferias_faltas_aprovadoPorId_fkey` FOREIGN KEY (`aprovadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_folha_pagamento` ADD CONSTRAINT `rh_folha_pagamento_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_folha_pagamento` ADD CONSTRAINT `rh_folha_pagamento_processadoPorId_fkey` FOREIGN KEY (`processadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_folha_pagamento` ADD CONSTRAINT `rh_folha_pagamento_aprovadoPorId_fkey` FOREIGN KEY (`aprovadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_ocorrencias_disciplinares` ADD CONSTRAINT `rh_ocorrencias_disciplinares_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_ocorrencias_disciplinares` ADD CONSTRAINT `rh_ocorrencias_disciplinares_registadoPorId_fkey` FOREIGN KEY (`registadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_ocorrencias_disciplinares` ADD CONSTRAINT `rh_ocorrencias_disciplinares_decididoPorId_fkey` FOREIGN KEY (`decididoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_formacoes` ADD CONSTRAINT `rh_formacoes_propostoPorId_fkey` FOREIGN KEY (`propostoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_formacoes` ADD CONSTRAINT `rh_formacoes_aprovadoPorId_fkey` FOREIGN KEY (`aprovadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_funcionario_formacoes` ADD CONSTRAINT `rh_funcionario_formacoes_formacaoId_fkey` FOREIGN KEY (`formacaoId`) REFERENCES `rh_formacoes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_funcionario_formacoes` ADD CONSTRAINT `rh_funcionario_formacoes_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_documentos` ADD CONSTRAINT `rh_documentos_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_documentos` ADD CONSTRAINT `rh_documentos_candidaturaId_fkey` FOREIGN KEY (`candidaturaId`) REFERENCES `rh_candidaturas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_documentos` ADD CONSTRAINT `rh_documentos_validadoPorId_fkey` FOREIGN KEY (`validadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_desligamentos` ADD CONSTRAINT `rh_desligamentos_funcionarioId_fkey` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_desligamentos` ADD CONSTRAINT `rh_desligamentos_iniciadoPorId_fkey` FOREIGN KEY (`iniciadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rh_desligamentos` ADD CONSTRAINT `rh_desligamentos_aprovadoPorId_fkey` FOREIGN KEY (`aprovadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
