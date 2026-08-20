import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolverAtendimentoDto {
  @ApiProperty() @IsString() desfecho: string;
}
