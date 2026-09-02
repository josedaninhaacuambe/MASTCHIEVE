import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetStudentPasswordDto {
  @ApiProperty() @IsString() @MinLength(6) newPassword: string;
}
