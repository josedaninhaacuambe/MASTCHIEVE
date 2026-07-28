import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebauthnRegistoVerifyDto {
  @ApiProperty() @IsString() dispositivoId: string;
  @ApiProperty() @IsObject() response: any;
  @ApiPropertyOptional() @IsOptional() @IsString() deviceLabel?: string;
}
