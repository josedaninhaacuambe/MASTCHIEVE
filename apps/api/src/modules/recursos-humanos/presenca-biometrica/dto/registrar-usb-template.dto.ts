import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarUsbTemplateDto {
  @ApiProperty() @IsString() fabricante: string;
  @ApiProperty() @IsString() templateBase64: string;
  @ApiPropertyOptional() @IsOptional() @IsString() templateFormato?: string;
}
