import { Module } from '@nestjs/common';
import { ComunicacaoController } from './comunicacao.controller';
import { ComunicacaoService } from './comunicacao.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [WhatsappModule, EmailModule],
  controllers: [ComunicacaoController],
  providers: [ComunicacaoService],
})
export class ComunicacaoModule {}
