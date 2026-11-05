import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoRegistoValues = ['ENTRADA', 'SAIDA', 'CANCELAMENTO'] as const;

export class CreateRegistoDto {
  @ApiProperty() @IsString() studentId: string;
  @ApiProperty({ enum: TipoRegistoValues }) @IsEnum(TipoRegistoValues) tipo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pessoaAutorizadaId?: string;
  @ApiPropertyOptional({ description: 'Obrigatória apenas em CANCELAMENTO' })
  @IsOptional() @IsString() justificativa?: string;
  @ApiPropertyOptional({ description: 'Hora real do registo, se for lançado mais tarde. Sem valor, usa a hora actual.' })
  @IsOptional() @IsDateString() dataHora?: string;
}
