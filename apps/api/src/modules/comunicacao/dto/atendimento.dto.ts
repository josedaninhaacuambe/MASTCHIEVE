import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CanalAtendimento {
  TELEFONE = 'TELEFONE',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  PRESENCIAL = 'PRESENCIAL',
}

export enum EstadoAtendimento {
  ABERTO = 'ABERTO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  RESOLVIDO = 'RESOLVIDO',
}

export class CreateAtendimentoDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() studentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() unidadeId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() assunto: string;
  @ApiProperty({ enum: CanalAtendimento }) @IsEnum(CanalAtendimento) canal: CanalAtendimento;
  @ApiProperty() @IsString() @IsNotEmpty() descricao: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() prazoResposta?: string;
}

export class UpdateAtendimentoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() resposta?: string;
  @ApiPropertyOptional({ enum: EstadoAtendimento }) @IsOptional() @IsEnum(EstadoAtendimento) estado?: EstadoAtendimento;
}
