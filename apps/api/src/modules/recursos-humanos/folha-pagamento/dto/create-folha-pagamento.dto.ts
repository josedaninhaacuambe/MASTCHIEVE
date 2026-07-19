import { IsString, IsOptional, IsInt, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolhaPagamentoDto {
  @ApiProperty() @IsString() funcionarioId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(12) mes: number;
  @ApiProperty() @IsInt() @Min(2000) ano: number;
  @ApiProperty() @IsNumber() salarioBase: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() premios?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() descontos?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() horasExtras?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() detalhes?: string;
}
