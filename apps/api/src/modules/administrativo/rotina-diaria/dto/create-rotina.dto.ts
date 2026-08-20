import { IsString, IsEnum, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoRotinaValues = ['ABERTURA', 'FECHO'] as const;

export class ChecklistItemDto {
  @ApiProperty() @IsString() item: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() concluido?: boolean;
}

export class CreateRotinaDto {
  @ApiProperty() @IsString() unidadeId: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() data?: string;
  @ApiProperty({ enum: TipoRotinaValues }) @IsEnum(TipoRotinaValues) tipo: string;
  @ApiProperty({ type: [ChecklistItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ChecklistItemDto)
  checklist: ChecklistItemDto[];
}
