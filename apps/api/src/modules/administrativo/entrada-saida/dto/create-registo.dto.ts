import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoRegistoValues = ['ENTRADA', 'SAIDA'] as const;

export class CreateRegistoDto {
  @ApiProperty() @IsString() studentId: string;
  @ApiProperty({ enum: TipoRegistoValues }) @IsEnum(TipoRegistoValues) tipo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pessoaAutorizadaId?: string;
  @ApiPropertyOptional({ description: 'Obrigatória em SAIDA quando não há pessoa autorizada' })
  @IsOptional() @IsString() justificativa?: string;
}
