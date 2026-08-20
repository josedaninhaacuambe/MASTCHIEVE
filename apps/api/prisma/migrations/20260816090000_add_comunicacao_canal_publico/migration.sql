-- AlterTable: pedidos_comunicacao — canal de envio e público-alvo (gap da reunião com o cliente)
ALTER TABLE `pedidos_comunicacao`
    ADD COLUMN `canal` VARCHAR(191) NOT NULL DEFAULT 'WHATSAPP',
    ADD COLUMN `publicoAlvo` VARCHAR(191) NOT NULL DEFAULT 'TODOS';
