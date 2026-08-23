-- CreateTable
CREATE TABLE `student_qr_credentials` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(64) NOT NULL,
    `tokenEncrypted` TEXT NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoPorId` VARCHAR(191) NOT NULL,
    `registadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revogadoEm` DATETIME(3) NULL,
    `ultimaUtilizacao` DATETIME(3) NULL,

    UNIQUE INDEX `student_qr_credentials_tokenHash_key`(`tokenHash`),
    INDEX `student_qr_credentials_studentId_idx`(`studentId`),
    INDEX `student_qr_credentials_studentId_ativo_idx`(`studentId`, `ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_qr_credentials` ADD CONSTRAINT `student_qr_credentials_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_qr_credentials` ADD CONSTRAINT `student_qr_credentials_criadoPorId_fkey` FOREIGN KEY (`criadoPorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
