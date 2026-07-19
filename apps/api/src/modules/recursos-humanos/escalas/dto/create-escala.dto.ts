import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TurnoValues = ['MANHA', 'TARDE', 'NOITE'] as const;
export const TipoEscalaValues = ['AULA', 'SALVAMENTO', 'ADMINISTRATIVO', 'FORMACAO', 'FOLGA'] as const;

export class CreateEscalaDto {
  @ApiProperty() @IsString() funcionarioId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unidadeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() classId?: string;
  @ApiProperty() @IsDateString() data: string;
  @ApiProperty({ enum: TurnoValues }) @IsEnum(TurnoValues) turno: string;
  @ApiProperty() @IsString() horaInicio: string;
  @ApiProperty() @IsString() horaFim: string;
  @ApiPropertyOptional({ enum: TipoEscalaValues }) @IsOptional() @IsEnum(TipoEscalaValues) tipo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
