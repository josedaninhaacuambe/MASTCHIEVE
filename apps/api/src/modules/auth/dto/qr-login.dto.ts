import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QrLoginDto {
  @ApiProperty({ example: 'mastchieve:qr:v1:9f3a...' })
  @IsString()
  @MinLength(10)
  token: string;
}
