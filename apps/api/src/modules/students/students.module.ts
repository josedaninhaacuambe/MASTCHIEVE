import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentsReportService } from './students-report.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, StudentsReportService],
  exports: [StudentsService],
})
export class StudentsModule {}
