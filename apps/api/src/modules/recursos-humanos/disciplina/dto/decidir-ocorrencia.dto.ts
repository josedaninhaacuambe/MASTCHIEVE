import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const DecisaoFinalValues = ['ADVERTENCIA', 'SUSPENSAO', 'RESCISAO_JUSTA_CAUSA', 'SEM_ACAO'] as const;

export class DecidirOcorrenciaDto {
  @ApiProperty({ enum: DecisaoFinalValues }) @IsEnum(DecisaoFinalValues) decisaoFinal: string;
  @ApiPropertyOptional() @IsOptional() @IsString() medidaAplicada?: string;
}
