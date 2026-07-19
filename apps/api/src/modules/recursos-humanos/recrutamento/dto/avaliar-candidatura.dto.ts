import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AvaliarCandidaturaDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) notaEntrevista?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(10) notaTestePratico?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoesRH?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() estado?: string;
}
