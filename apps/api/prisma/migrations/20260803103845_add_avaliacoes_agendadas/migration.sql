-- CreateTable
CREATE TABLE `avaliacoes_agendadas` (
    `id` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `data` DATETIME(3) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'AGENDADA',
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `avaliacoes_agendadas_instructorId_idx`(`instructorId`),
    INDEX `avaliacoes_agendadas_classId_idx`(`classId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacoes_agendadas_resultados` (
    `id` VARCHAR(191) NOT NULL,
    `sessaoId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `studentFaseId` VARCHAR(191) NOT NULL,
    `pontuacoes` TEXT NOT NULL,
    `soma` INTEGER NOT NULL,
    `totalMinimoSnapshot` INTEGER NOT NULL,
    `aprovado` BOOLEAN NOT NULL,
    `motivoReprovacao` TEXT NULL,
    `avaliadoPorId` VARCHAR(191) NULL,
    `avaliadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `avaliacoes_agendadas_resultados_studentId_idx`(`studentId`),
    INDEX `avaliacoes_agendadas_resultados_studentFaseId_idx`(`studentFaseId`),
    UNIQUE INDEX `avaliacoes_agendadas_resultados_sessaoId_studentId_key`(`sessaoId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `avaliacoes_agendadas` ADD CONSTRAINT `avaliacoes_agendadas_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_agendadas` ADD CONSTRAINT `avaliacoes_agendadas_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_agendadas_resultados` ADD CONSTRAINT `avaliacoes_agendadas_resultados_sessaoId_fkey` FOREIGN KEY (`sessaoId`) REFERENCES `avaliacoes_agendadas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_agendadas_resultados` ADD CONSTRAINT `avaliacoes_agendadas_resultados_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_agendadas_resultados` ADD CONSTRAINT `avaliacoes_agendadas_resultados_studentFaseId_fkey` FOREIGN KEY (`studentFaseId`) REFERENCES `student_fases`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_agendadas_resultados` ADD CONSTRAINT `avaliacoes_agendadas_resultados_avaliadoPorId_fkey` FOREIGN KEY (`avaliadoPorId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
