import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KioskUsbMarcarDto {
  @ApiProperty() @IsString() funcionarioId: string;
}
