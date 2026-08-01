-- CreateTable
CREATE TABLE `athlete_reports` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `instructorId` VARCHAR(191) NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `referenceMonth` VARCHAR(191) NULL,
    `mensagem` TEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `athlete_reports_studentId_idx`(`studentId`),
    INDEX `athlete_reports_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `athlete_reports` ADD CONSTRAINT `athlete_reports_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `athlete_reports` ADD CONSTRAINT `athlete_reports_instructorId_fkey` FOREIGN KEY (`instructorId`) REFERENCES `instructors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
