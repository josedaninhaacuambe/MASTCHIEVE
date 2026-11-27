import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsUUID, IsInt, IsISO8601, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const ESTADO_VALUES = ['NAO_INICIADO', 'EM_PROGRESSO', 'CONCLUIDO'] as const;

export class CriterioScoreDto {
  @ApiPropertyOptional() @IsInt() @Min(0) index: number;
  @ApiPropertyOptional() @IsInt() @Min(1) @Max(5) valor: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observacao?: string;
}

export class UpdateStudentFaseDto {
  @ApiPropertyOptional({ enum: ESTADO_VALUES })
  @IsOptional() @IsIn(ESTADO_VALUES) estado?: string;

  @ApiPropertyOptional() @IsOptional() @IsISO8601() iniciadoEm?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() concluidoEm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;

  @ApiPropertyOptional({ type: [CriterioScoreDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioScoreDto)
  avaliacoes?: CriterioScoreDto[];
}

export class AtribuirModuloDto {
  @ApiPropertyOptional() @IsUUID() faseId: string;
  @ApiPropertyOptional({ type: [String] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @IsUUID('all', { each: true })
  studentIds: string[];
}
