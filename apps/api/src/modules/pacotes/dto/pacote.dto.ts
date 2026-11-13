import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreatePacoteDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120) nome: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) descricao?: string;
  @ApiProperty({ description: 'Preço mensal em MT' }) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(10_000_000) preco: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(14) aulasPorSemana?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() ativo?: boolean;
}

export class UpdatePacoteDto extends PartialType(CreatePacoteDto) {}
