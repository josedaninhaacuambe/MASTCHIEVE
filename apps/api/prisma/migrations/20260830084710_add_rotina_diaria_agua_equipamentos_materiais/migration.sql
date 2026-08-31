-- AlterTable
ALTER TABLE `rotinas_diarias` ADD COLUMN `aguaCloro` DOUBLE NULL,
    ADD COLUMN `aguaFotoUrl` VARCHAR(500) NULL,
    ADD COLUMN `aguaPh` DOUBLE NULL,
    ADD COLUMN `aguaRegistadoEm` DATETIME(3) NULL,
    ADD COLUMN `aguaRegistadoPorId` VARCHAR(191) NULL,
    ADD COLUMN `aguaTemperatura` DOUBLE NULL,
    ADD COLUMN `equipamentosFotoUrl` VARCHAR(500) NULL,
    ADD COLUMN `equipamentosRegistadoEm` DATETIME(3) NULL,
    ADD COLUMN `equipamentosRegistadoPorId` VARCHAR(191) NULL,
    ADD COLUMN `equipamentosSeguranca` TEXT NULL;

-- CreateTable
CREATE TABLE `rotina_diaria_materiais` (
    `id` VARCHAR(191) NOT NULL,
    `rotinaDiariaId` VARCHAR(191) NOT NULL,
    `instrutorId` VARCHAR(191) NOT NULL,
    `item` VARCHAR(191) NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `fotoUrl` VARCHAR(500) NULL,
    `registadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `rotina_diaria_materiais_rotinaDiariaId_idx`(`rotinaDiariaId`),
    INDEX `rotina_diaria_materiais_instrutorId_idx`(`instrutorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rotinas_diarias` ADD CONSTRAINT `rotinas_diarias_aguaRegistadoPorId_fkey` FOREIGN KEY (`aguaRegistadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rotinas_diarias` ADD CONSTRAINT `rotinas_diarias_equipamentosRegistadoPorId_fkey` FOREIGN KEY (`equipamentosRegistadoPorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rotina_diaria_materiais` ADD CONSTRAINT `rotina_diaria_materiais_rotinaDiariaId_fkey` FOREIGN KEY (`rotinaDiariaId`) REFERENCES `rotinas_diarias`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rotina_diaria_materiais` ADD CONSTRAINT `rotina_diaria_materiais_instrutorId_fkey` FOREIGN KEY (`instrutorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
