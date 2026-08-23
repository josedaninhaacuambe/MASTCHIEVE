import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentsReportService } from './students-report.service';
import { StudentsQrService } from './students-qr.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentsReportService, StudentsQrService],
  exports: [StudentsService],
})
export class StudentsModule {}
