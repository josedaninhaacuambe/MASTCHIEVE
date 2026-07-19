import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoCertificacaoValues = [
  'NADADOR_SALVADOR',
  'INSTRUTOR_NATACAO',
  'PRIMEIROS_SOCORROS',
  'REGISTO_CRIMINAL',
  'ATESTADO_APTIDAO_FISICA',
  'OUTRO',
] as const;

export class CreateCertificacaoDto {
  @ApiProperty() @IsString() funcionarioId: string;
  @ApiProperty({ enum: TipoCertificacaoValues }) @IsEnum(TipoCertificacaoValues) tipo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroDocumento?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() entidadeEmissora?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataEmissao?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataValidade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentoUrl?: string;
}
