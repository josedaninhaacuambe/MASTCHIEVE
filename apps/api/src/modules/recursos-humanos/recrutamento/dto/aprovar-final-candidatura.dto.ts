import { IsString, IsOptional, IsEmail, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoContratoValues = ['EFETIVO', 'TERMO_CERTO', 'TERMO_INCERTO', 'ESTAGIO', 'PRESTACAO_SERVICOS'] as const;

export class AprovarFinalCandidaturaDto {
  @ApiPropertyOptional({ description: 'Necessário se a candidatura não tiver email' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() password?: string;
  @ApiProperty() @IsNumber() salarioBase: number;
  @ApiProperty() @IsDateString() dataInicio: string;
  @ApiProperty({ enum: TipoContratoValues }) @IsEnum(TipoContratoValues) tipoContrato: string;
}
