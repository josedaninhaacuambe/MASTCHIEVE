import { IsString, IsOptional, IsEnum, IsInt, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoDesligamentoValues = [
  'DEMISSAO_VOLUNTARIA',
  'DESPEDIMENTO_SEM_JUSTA_CAUSA',
  'DESPEDIMENTO_JUSTA_CAUSA',
  'FIM_CONTRATO',
  'REFORMA',
] as const;

export class CreateDesligamentoDto {
  @ApiProperty() @IsString() funcionarioId: string;
  @ApiProperty({ enum: TipoDesligamentoValues }) @IsEnum(TipoDesligamentoValues) tipo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() motivo?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataSaida?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) avisoPrevioDias?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() valorAcertoContas?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() detalhesAcerto?: string;
}
