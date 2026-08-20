import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoVisitanteValues = ['VISITANTE', 'ENCARREGADO', 'FORNECEDOR', 'OUTRO'] as const;

export class CreateAtendimentoDto {
  @ApiProperty() @IsString() nome: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contacto?: string;
  @ApiPropertyOptional({ enum: TipoVisitanteValues, default: 'VISITANTE' })
  @IsOptional() @IsEnum(TipoVisitanteValues) tipoVisitante?: string;
  @ApiProperty() @IsString() motivo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unidadeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() encaminhadoParaId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() prazo?: string;
}
