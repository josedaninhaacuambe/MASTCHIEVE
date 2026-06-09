import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, IsEnum, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ModuleLevel {
  BEGINNER = 'BEGINNER',
  ELEMENTARY = 'ELEMENTARY',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  COMPETITIVE = 'COMPETITIVE',
}

export class CreateSwimmingModuleDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: ModuleLevel }) @IsEnum(ModuleLevel) level: ModuleLevel;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) order: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
}

export class UpdateProgressDto {
  @ApiProperty({ enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REVIEW'] })
  @IsString() status: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
