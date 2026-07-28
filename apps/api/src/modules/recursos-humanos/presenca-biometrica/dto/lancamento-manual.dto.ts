import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoRegistoValues = ['ENTRADA', 'SAIDA'] as const;

export class LancamentoManualDto {
  @ApiProperty() @IsString() funcionarioId: string;
  @ApiProperty({ enum: TipoRegistoValues }) @IsEnum(TipoRegistoValues) tipo: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() timestamp?: string;
  @ApiProperty() @IsString() observacao: string;
}
