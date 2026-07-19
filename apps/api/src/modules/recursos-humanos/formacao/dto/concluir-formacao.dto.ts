import { IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConcluirFormacaoDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() notaFinal?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() certificadoUrl?: string;
}
