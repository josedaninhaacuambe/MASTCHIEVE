import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WebauthnRegistoOptionsDto {
  @ApiProperty() @IsString() dispositivoId: string;
}
