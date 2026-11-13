import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsObject, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';

export const DIAS_PLANO = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] as const;

export class ParteAulaDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80) nome: string;
  @ApiPropertyOptional({ description: 'Duração, ex.: "10 min"' }) @IsOptional() @IsString() @MaxLength(20) tempo?: string;
  @ApiProperty({ description: 'Exercícios por dia: { SEG: "...", TER: "..." }' }) @IsObject() dias: Record<string, string>;
}

export class GuardarPlanoAulaDto {
  @ApiProperty() @IsUUID() classId: string;
  @ApiProperty({ description: 'Qualquer dia da semana (AAAA-MM-DD); é guardado na segunda-feira dessa semana' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'semana deve estar no formato AAAA-MM-DD' })
  semana: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) nivel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) objetivoSemana?: string;
  @ApiProperty({ type: [ParteAulaDto] })
  @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => ParteAulaDto)
  partes: ParteAulaDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) observacoes?: string;
}
