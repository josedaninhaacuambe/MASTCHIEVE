import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoOcorrenciaValues = [
  'ATRASO',
  'ABSENTISMO',
  'CONDUTA_INADEQUADA',
  'VIOLACAO_SEGURANCA',
  'REINCIDENCIA',
  'OUTRO',
] as const;

export const GravidadeValues = ['LEVE', 'MODERADA', 'GRAVE'] as const;

export class CreateOcorrenciaDto {
  @ApiProperty() @IsString() funcionarioId: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() data?: string;
  @ApiProperty({ enum: TipoOcorrenciaValues }) @IsEnum(TipoOcorrenciaValues) tipo: string;
  @ApiPropertyOptional({ enum: GravidadeValues, default: 'LEVE' }) @IsOptional() @IsEnum(GravidadeValues) gravidade?: string;
  @ApiProperty() @IsString() descricao: string;
}
