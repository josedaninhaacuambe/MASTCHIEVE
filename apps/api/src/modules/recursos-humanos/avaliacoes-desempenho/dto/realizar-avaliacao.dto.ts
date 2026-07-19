import { IsOptional, IsInt, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RealizarAvaliacaoDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) pontualidade?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) competenciaTecnica?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) trabalhoEquipa?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(5) atendimento?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() pontosFortes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() areasMelhoria?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() planoDesenvolvimento?: string;
}
