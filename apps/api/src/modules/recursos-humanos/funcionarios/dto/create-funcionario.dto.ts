import { IsString, IsOptional, IsEnum, IsEmail, IsDateString, IsNumber, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CargoValues = [
  'INSTRUTOR_NATACAO',
  'SALVA_VIDAS',
  'RECEPCIONISTA',
  'ADMINISTRATIVO',
  'COORDENADOR',
  'MANUTENCAO',
  'OUTRO',
] as const;

export const DepartamentoValues = ['OPERACOES', 'ADMINISTRATIVO', 'FINANCEIRO', 'MANUTENCAO'] as const;

export class CreateFuncionarioDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional({ minLength: 8 }) @IsOptional() @IsString() @MinLength(8) password?: string;
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() biNumero?: string;
  @ApiProperty({ enum: CargoValues }) @IsEnum(CargoValues) cargo: string;
  @ApiPropertyOptional({ enum: DepartamentoValues }) @IsOptional() @IsEnum(DepartamentoValues) departamento?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataAdmissao?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactoEmergencia?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefoneEmergencia?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salarioBase?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() unidadeId?: string;
}
