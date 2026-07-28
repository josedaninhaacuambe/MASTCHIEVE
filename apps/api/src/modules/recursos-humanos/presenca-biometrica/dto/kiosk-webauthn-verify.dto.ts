import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KioskWebauthnVerifyDto {
  @ApiProperty() @IsObject() response: any;
}
