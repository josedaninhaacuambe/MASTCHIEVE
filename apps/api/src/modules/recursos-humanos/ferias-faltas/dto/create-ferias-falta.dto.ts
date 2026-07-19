import { IsString, IsOptional, IsEnum, IsDateString, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoFeriasFaltaValues = [
  'FERIAS',
  'FALTA_JUSTIFICADA',
  'FALTA_INJUSTIFICADA',
  'LICENCA_MEDICA',
  'LICENCA_MATERNIDADE',
  'OUTRO',
] as const;

export class CreateFeriasFaltaDto {
  @ApiProperty() @IsString() funcionarioId: string;
  @ApiProperty({ enum: TipoFeriasFaltaValues }) @IsEnum(TipoFeriasFaltaValues) tipo: string;
  @ApiProperty() @IsDateString() dataInicio: string;
  @ApiProperty() @IsDateString() dataFim: string;
  @ApiProperty() @IsInt() @Min(1) diasSolicitados: number;
  @ApiPropertyOptional() @IsOptional() @IsString() motivo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentoUrl?: string;
  @ApiPropertyOptional({ default: false, description: 'Marca o pedido como excecional — exige aprovação do Super Admin' })
  @IsOptional() @IsBoolean() excepcional?: boolean;
}
