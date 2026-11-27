import { IsOptional, IsString, IsBoolean, IsIn, IsInt, Min, Max, MaxLength, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const paraBool = ({ value }: { value: any }) => (typeof value === 'boolean' ? value : value === 'true' || value === '1');

export class StudentQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ obj }) => {
    const raw = obj.isActive;
    if (typeof raw === 'boolean') return raw;
    return raw === 'true' || raw === '1';
  })
  @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() classId?: string;
  @ApiPropertyOptional({ description: 'ID da unidade, ou SEM_UNIDADE' }) @IsOptional() @IsString() @MaxLength(60) unidadeId?: string;
  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'], description: 'Sexo do atleta' }) @IsOptional() @IsIn(['MALE', 'FEMALE', 'OTHER']) genero?: string;
  @ApiPropertyOptional({ description: 'Nível da turma activa (BEGINNER, ...)' }) @IsOptional() @IsString() @MaxLength(30) nivel?: string;
  @ApiPropertyOptional({ description: 'Só atletas com mensalidades em atraso' }) @IsOptional() @Transform(paraBool) @IsBoolean() irregular?: boolean;
  @ApiPropertyOptional({ description: 'Campanha de origem (CRM)' }) @IsOptional() @IsString() @MaxLength(120) campanha?: string;
  @ApiPropertyOptional({ description: 'Só atletas sem módulo em progresso' }) @IsOptional() @Transform(paraBool) @IsBoolean() semModulo?: boolean;
  @ApiPropertyOptional({ description: 'ID do módulo: módulo em progresso do atleta ou módulo dado na turma' }) @IsOptional() @IsString() @MaxLength(60) moduleId?: string;
  @ApiPropertyOptional({ description: 'Dia do horário da turma (ex.: Segunda)' }) @IsOptional() @IsString() @MaxLength(20) dia?: string;
  @ApiPropertyOptional({ description: 'Hora de início do horário (HH:mm)' }) @IsOptional() @Matches(/^\d{2}:\d{2}$/) hora?: string;
  @ApiPropertyOptional({ description: 'Etiqueta (ex.: BM), ou SEM_ETIQUETA' }) @IsOptional() @IsString() @MaxLength(40) etiqueta?: string;
  @ApiPropertyOptional({ description: 'Só atletas sem turma activa' }) @IsOptional() @Transform(paraBool) @IsBoolean() semTurma?: boolean;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}
