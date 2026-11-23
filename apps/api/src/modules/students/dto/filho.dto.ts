import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, MaxLength, MinLength, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const GenderValues = ['MALE', 'FEMALE', 'OTHER'] as const;

/** Filho de um atleta adulto, inscrito pela secretaria (assistente administrativo / admin). */
export class AdicionarFilhoDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80) firstName: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80) lastName: string;
  @ApiProperty() @IsDateString() dateOfBirth: string;
  @ApiProperty({ enum: GenderValues }) @IsEnum(GenderValues) gender: string;
  @ApiPropertyOptional({ description: 'Turma do filho (da mesma unidade do encarregado)' }) @IsOptional() @IsUUID() classId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) medicalNotes?: string;
  @ApiPropertyOptional({ description: 'Parentesco (ex.: Pai, Mãe)' }) @IsOptional() @IsString() @MaxLength(40) relationship?: string;
}

/** Alocação de vários atletas a uma unidade e/ou turma (selecção feita na lista de atletas). */
export class AlocarAtletasDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @IsUUID('all', { each: true }) studentIds: string[];
  @ApiPropertyOptional() @IsOptional() @IsUUID() unidadeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() classId?: string;
}
