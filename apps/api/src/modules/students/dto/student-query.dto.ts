import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StudentQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ obj }) => {
    const raw = obj.isActive;
    if (typeof raw === 'boolean') return raw;
    return raw === 'true' || raw === '1';
  })
  @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() classId?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}
