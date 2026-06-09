import { IsString, IsNotEmpty, IsInt, IsOptional, Min, Max, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ClassLevel {
  BEGINNER = 'BEGINNER',
  ELEMENTARY = 'ELEMENTARY',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  COMPETITIVE = 'COMPETITIVE',
}

export class CreateClassDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;

  @ApiProperty({ enum: ClassLevel, default: ClassLevel.BEGINNER })
  @IsEnum(ClassLevel)
  level: ClassLevel = ClassLevel.BEGINNER;

  @ApiProperty({ default: 12 })
  @Type(() => Number)
  @IsInt() @Min(1) @Max(100)
  maxStudents: number = 12;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() poolLane?: string;

  @ApiProperty() @IsUUID() instructorId: string;
}

export class CreateSessionDto {
  @ApiProperty() @IsString() @IsNotEmpty() sessionDate: string;

  @ApiPropertyOptional() @IsOptional() @IsString() startTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() topic?: string;
}
