import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CategoriaItemValues = ['EQUIPAMENTO', 'MATERIAL_LIMPEZA', 'MATERIAL_ESCRITORIO', 'EPI', 'OUTRO'] as const;

export class CreateItemDto {
  @ApiProperty() @IsString() nome: string;
  @ApiPropertyOptional({ enum: CategoriaItemValues, default: 'OUTRO' })
  @IsOptional() @IsEnum(CategoriaItemValues) categoria?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unidadeId?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) quantidade?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) quantidadeMin?: number;
  @ApiPropertyOptional({ default: 'UN' }) @IsOptional() @IsString() unidadeMedida?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() localizacao?: string;
}
