import { IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CriterioAvaliacaoInputDto {
  @ApiProperty() @IsInt() @Min(0) criterioIndex: number;
  @ApiProperty() @IsInt() @Min(1) @Max(5) valor: number;
}

export class SubmitResultadoDto {
  @ApiProperty({ type: [CriterioAvaliacaoInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioAvaliacaoInputDto)
  avaliacoes: CriterioAvaliacaoInputDto[];
}
