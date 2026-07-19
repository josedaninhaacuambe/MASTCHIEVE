import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejeitarDto {
  @ApiPropertyOptional() @IsOptional() @IsString() motivoRejeicao?: string;
}
