import { IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Campos que a ficha diagnóstica pode gravar (os restantes são ignorados pela validação). */
export class AvaliacaoInicialBaseDto {
  @ApiPropertyOptional() @IsOptional() @IsISO8601() data?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) experienciaAquatica?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) segurancaAdaptacao?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) confortoAgua?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) resistenciaBasica?: number;
  @ApiPropertyOptional({ description: 'JSON: [{fase,criterio,valor}]' }) @IsOptional() @IsString() @MaxLength(60_000) criteriosAvaliados?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) necessidadesEspeciais?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) observacoes?: string;
  @ApiPropertyOptional({ description: 'Módulo em que o atleta começa' }) @IsOptional() @IsUUID() faseRecomendadaId?: string;
}

export class CreateAvaliacaoInicialDto extends AvaliacaoInicialBaseDto {
  @ApiProperty() @IsUUID() studentId: string;
  @ApiPropertyOptional({ description: 'Instrutor que avaliou (obrigatório quando quem regista não é instrutor)' })
  @IsOptional() @IsUUID() instrutorId?: string;
}

export class UpdateAvaliacaoInicialDto extends AvaliacaoInicialBaseDto {}
