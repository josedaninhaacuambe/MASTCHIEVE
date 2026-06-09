import { IsString, IsUUID, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

function ScoreField() {
  return function (target: any, key: string) {
    IsOptional()(target, key);
    IsNumber()(target, key);
    Min(0)(target, key);
    Max(10)(target, key);
    Type(() => Number)(target, key);
  };
}

export class RecordPerformanceDto {
  @ApiProperty() @IsUUID() studentId: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() sessionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() instructorId?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10)
  technique?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10)
  stamina?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10)
  speed?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10)
  coordination?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10)
  breathing?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10)
  turns?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(10)
  startDive?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() instructorNotes?: string;
}

export class ReviewFeedbackDto {
  @ApiProperty() @IsString() instructorNotes: string;
  @ApiProperty() approve: boolean;
}
