import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCandidaturaDto {
  @ApiProperty() @IsString() vagaId: string;
  @ApiProperty() @IsString() nomeCandidato: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cvUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cartaMotivacao?: string;
}
