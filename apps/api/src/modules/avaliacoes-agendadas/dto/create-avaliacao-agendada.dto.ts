import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAvaliacaoAgendadaDto {
  @ApiProperty() @IsString() @IsNotEmpty() classId: string;
  @ApiProperty() @IsISO8601() data: string;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
