-- AlterTable
ALTER TABLE `links_partilha` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `conteudo` TEXT NULL,
    ADD COLUMN `ctaTexto` VARCHAR(191) NULL,
    ADD COLUMN `ctaUrl` TEXT NULL,
    ADD COLUMN `imagemUrl` TEXT NULL,
    ADD COLUMN `subtitulo` VARCHAR(191) NULL,
    ADD COLUMN `titulo` VARCHAR(191) NULL,
    ADD COLUMN `videoUrl` TEXT NULL;
