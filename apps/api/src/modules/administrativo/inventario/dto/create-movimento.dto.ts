import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoMovimentoValues = ['ENTRADA', 'SAIDA', 'AJUSTE'] as const;

export class CreateMovimentoDto {
  @ApiProperty({ enum: TipoMovimentoValues }) @IsEnum(TipoMovimentoValues) tipo: string;
  @ApiProperty({ description: 'ENTRADA/SAIDA: quantidade positiva. AJUSTE: delta (pode ser negativo).' })
  @IsInt() quantidade: number;
  @ApiPropertyOptional() @IsOptional() @IsString() motivo?: string;
}
