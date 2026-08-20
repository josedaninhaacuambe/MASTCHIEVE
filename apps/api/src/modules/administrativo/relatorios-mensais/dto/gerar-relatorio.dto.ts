import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GerarRelatorioDto {
  @ApiPropertyOptional() @IsOptional() @IsString() unidadeId?: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) @Max(12) mes: number;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(2020) ano: number;
}
