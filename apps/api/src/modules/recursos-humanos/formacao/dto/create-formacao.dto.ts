import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoFormacaoValues = ['RECICLAGEM', 'CERTIFICACAO', 'SOFT_SKILLS', 'SEGURANCA', 'OUTRO'] as const;

export class CreateFormacaoDto {
  @ApiProperty() @IsString() titulo: string;
  @ApiProperty({ enum: TipoFormacaoValues }) @IsEnum(TipoFormacaoValues) tipo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() custoEstimado?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataInicio?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataFim?: string;
}
