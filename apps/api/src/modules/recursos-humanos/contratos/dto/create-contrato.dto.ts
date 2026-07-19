import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoContratoValues = ['EFETIVO', 'TERMO_CERTO', 'TERMO_INCERTO', 'ESTAGIO', 'PRESTACAO_SERVICOS'] as const;

export class CreateContratoDto {
  @ApiProperty() @IsString() funcionarioId: string;
  @ApiProperty({ enum: TipoContratoValues }) @IsEnum(TipoContratoValues) tipo: string;
  @ApiProperty() @IsString() cargo: string;
  @ApiProperty() @IsNumber() salarioBase: number;
  @ApiProperty() @IsDateString() dataInicio: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataFim?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() clausulas?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentoUrl?: string;
}
