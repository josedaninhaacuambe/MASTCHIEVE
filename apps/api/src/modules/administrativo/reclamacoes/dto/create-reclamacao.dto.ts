import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoReclamacaoValues = ['RECLAMACAO', 'SUGESTAO', 'ELOGIO'] as const;
export const CategoriaReclamacaoValues = ['ATENDIMENTO', 'INSTALACOES', 'FINANCEIRO', 'PEDAGOGICO', 'OUTRO'] as const;

export class CreateReclamacaoDto {
  @ApiProperty({ enum: TipoReclamacaoValues }) @IsEnum(TipoReclamacaoValues) tipo: string;
  @ApiPropertyOptional({ enum: CategoriaReclamacaoValues, default: 'OUTRO' })
  @IsOptional() @IsEnum(CategoriaReclamacaoValues) categoria?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() studentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nome?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contacto?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unidadeId?: string;
  @ApiProperty() @IsString() descricao: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() prazoResposta?: string;
}
