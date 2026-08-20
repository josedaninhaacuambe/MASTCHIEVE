import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePessoaAutorizadaDto {
  @ApiProperty() @IsString() studentId: string;
  @ApiProperty() @IsString() nome: string;
  @ApiProperty() @IsString() parentesco: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentoId?: string;
}
