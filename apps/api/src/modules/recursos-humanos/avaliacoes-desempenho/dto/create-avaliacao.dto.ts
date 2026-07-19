import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAvaliacaoDto {
  @ApiProperty() @IsString() funcionarioId: string;
  @ApiProperty() @IsString() periodo: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dataLimite?: string;
}
