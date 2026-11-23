import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsInt, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoFormacaoValues = ['RECICLAGEM', 'CERTIFICACAO', 'SOFT_SKILLS', 'SEGURANCA', 'OUTRO'] as const;

export class CreateFormacaoDto {
  @ApiProperty() @IsString() titulo: string;
  @ApiProperty({ enum: TipoFormacaoValues }) @IsEnum(TipoFormacaoValues) tipo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() custoEstimado?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataInicio?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataFim?: string;
  @ApiPropertyOptional({ description: 'Número máximo de participantes' })
  @IsOptional() @IsInt() @Min(1) @Max(1000) vagas?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(191) local?: string;
}
