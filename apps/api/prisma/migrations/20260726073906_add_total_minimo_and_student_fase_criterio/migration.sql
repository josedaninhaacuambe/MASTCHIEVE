-- AlterTable
ALTER TABLE `fases_progressao` ADD COLUMN `totalMinimo` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `student_fase_criterios` (
    `id` VARCHAR(191) NOT NULL,
    `studentFaseId` VARCHAR(191) NOT NULL,
    `criterioIndex` INTEGER NOT NULL,
    `valor` INTEGER NOT NULL,
    `observacao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_fase_criterios_studentFaseId_criterioIndex_key`(`studentFaseId`, `criterioIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_fase_criterios` ADD CONSTRAINT `student_fase_criterios_studentFaseId_fkey` FOREIGN KEY (`studentFaseId`) REFERENCES `student_fases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
