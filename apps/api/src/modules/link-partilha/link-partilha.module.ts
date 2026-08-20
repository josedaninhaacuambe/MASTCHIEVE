import { Module } from '@nestjs/common';
import { LinkPartilhaController } from './link-partilha.controller';
import { LinkPartilhaService } from './link-partilha.service';

@Module({
  controllers: [LinkPartilhaController],
  providers: [LinkPartilhaService],
  exports: [LinkPartilhaService],
})
export class LinkPartilhaModule {}
