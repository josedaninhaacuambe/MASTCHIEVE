import { IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChecklistItemDto } from './create-rotina.dto';

export class UpdateRotinaDto {
  @ApiProperty({ type: [ChecklistItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => ChecklistItemDto)
  checklist: ChecklistItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
