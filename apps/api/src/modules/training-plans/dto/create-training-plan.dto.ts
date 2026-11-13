import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, Max, ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExercicioPlanoDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200)
  name: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Duração (texto livre, ex.: "10 min")' })
  @IsOptional() @IsString() @MaxLength(50)
  duration?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(1000)
  sets?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(10000)
  reps?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}

/** Plano de treino criado pelo instrutor (escrito à mão ou importado de um ficheiro de texto). */
export class CreateTrainingPlanDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  studentId: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(190)
  title: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20000)
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true }) @MaxLength(500, { each: true })
  objectives?: string[];

  @ApiPropertyOptional({ type: [ExercicioPlanoDto] })
  @IsOptional() @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => ExercicioPlanoDto)
  exercises?: ExercicioPlanoDto[];

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  validUntil?: string;
}
