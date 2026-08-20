import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const EstadoReclamacaoValues = ['ABERTA', 'EM_ANALISE', 'RESPONDIDA', 'FECHADA'] as const;

export class UpdateEstadoReclamacaoDto {
  @ApiProperty({ enum: EstadoReclamacaoValues }) @IsEnum(EstadoReclamacaoValues) estado: string;
}
