import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { RecursosHumanosModule } from '../recursos-humanos/recursos-humanos.module';

@Module({
  imports: [RecursosHumanosModule],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
