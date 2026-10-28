import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID,
  Matches, Max, MaxLength, Min, MinLength, ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ESTADOS_PARTICIPANTE, MAX_ALUNOS_ESCOLA, NIVEIS_NATACAO, PROVAS } from '../eventos-formulario.util';

const trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
const vazioParaUndefined = () =>
  Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : typeof value === 'string' ? value.trim() : value));
const TELEFONE = /^\+?[\d\s()-]{7,20}$/;
const TELEFONE_MSG = 'Contacto inválido — use apenas dígitos (ex.: +258 84 123 4567)';

// ─── Formulário público: INDIVIDUAL (Open Day) ─────────────────────────────

export class PreInscricaoIndividualDto {
  @ApiProperty() @trim() @IsString() @MinLength(3, { message: 'Indique o nome completo' }) @MaxLength(120) nomeCompleto: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(60) nomePreferido?: string;
  @ApiPropertyOptional({ enum: ['F', 'M'] }) @vazioParaUndefined() @IsOptional() @IsIn(['F', 'M']) genero?: 'F' | 'M';
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsDateString({}, { message: 'Data de nascimento inválida' }) dataNascimento?: string;
  @ApiProperty() @trim() @Matches(TELEFONE, { message: TELEFONE_MSG }) contacto: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsEmail({}, { message: 'Email inválido' }) @MaxLength(120) email?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(40) documentoIdentificacao?: string;
  @ApiPropertyOptional({ enum: PROVAS, isArray: true })
  @IsOptional() @IsArray() @ArrayMaxSize(PROVAS.length) @IsIn(PROVAS as unknown as string[], { each: true }) provas?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() experienciaPrevia?: boolean;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(200) comoConheceu?: string;
  @ApiPropertyOptional({ enum: NIVEIS_NATACAO }) @vazioParaUndefined() @IsOptional() @IsIn(NIVEIS_NATACAO as unknown as string[]) nivelNatacao?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() condicaoSaude?: boolean;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(500) condicaoSaudeDetalhe?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @Matches(TELEFONE, { message: TELEFONE_MSG }) contactoEmergencia?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(60) parentescoEmergencia?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(120) instituicao?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autorizacaoImagem?: boolean;
  @ApiProperty({ description: 'Declaração de veracidade (substitui a assinatura do modelo em papel)' }) @IsBoolean() declaracao: boolean;
  /** Honeypot anti-spam: tem de vir vazio. */
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(0, { message: 'Pedido inválido' }) website?: string;
}

// ─── Formulário público: ESCOLA (Voucher) ──────────────────────────────────

export class AlunoEscolaDto {
  @ApiProperty() @trim() @IsString() @MinLength(3, { message: 'Indique o nome de cada aluno' }) @MaxLength(120) nome: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(2) @Max(25) idade?: number;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(30) classe?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @Matches(TELEFONE, { message: TELEFONE_MSG }) contactoEncarregado?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(20) horario?: string;
}

export class PreInscricaoEscolaDto {
  @ApiProperty() @trim() @IsString() @MinLength(2, { message: 'Indique a escola' }) @MaxLength(150) escola: string;
  @ApiProperty() @trim() @IsString() @MinLength(3, { message: 'Indique o responsável' }) @MaxLength(120) responsavel: string;
  @ApiProperty() @trim() @Matches(TELEFONE, { message: TELEFONE_MSG }) contactoEscola: string;
  @ApiPropertyOptional({ description: 'Não consta do modelo; opcional para receber a confirmação por email' })
  @vazioParaUndefined() @IsOptional() @IsEmail({}, { message: 'Email inválido' }) @MaxLength(120) email?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(150) localAulas?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsDateString({}, { message: 'Data de início inválida' }) semanaInicio?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsDateString({}, { message: 'Data de fim inválida' }) semanaFim?: string;
  @ApiProperty({ type: [AlunoEscolaDto] })
  @IsArray() @ArrayMinSize(1, { message: 'Indique pelo menos um aluno' }) @ArrayMaxSize(MAX_ALUNOS_ESCOLA, { message: `Máximo de ${MAX_ALUNOS_ESCOLA} alunos por formulário` })
  @ValidateNested({ each: true }) @Type(() => AlunoEscolaDto)
  alunos: AlunoEscolaDto[];
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(1000) observacoes?: string;
  @ApiProperty() @IsBoolean() declaracao: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(0, { message: 'Pedido inválido' }) website?: string;
}

// ─── Staff ─────────────────────────────────────────────────────────────────

export class EstadoParticipanteDto {
  @ApiProperty({ enum: ESTADOS_PARTICIPANTE }) @IsIn(ESTADOS_PARTICIPANTE as unknown as string[]) estado: string;
}

export class WalkInDto {
  @ApiProperty() @trim() @IsString() @MinLength(2) @MaxLength(120) nome: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @Matches(TELEFONE, { message: TELEFONE_MSG }) contacto?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() studentId?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(500) notas?: string;
}

export class ComunicacaoEventoDto {
  @ApiProperty() @trim() @IsString() @MinLength(3) @MaxLength(150) titulo: string;
  @ApiProperty() @trim() @IsString() @MinLength(5) @MaxLength(3000) mensagem: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(500) videoUrl?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(500) galeriaUrl?: string;
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(2000) proximasActividades?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() incluirLinkInscricao?: boolean;
  @ApiProperty({ enum: ['WHATSAPP', 'EMAIL'], isArray: true })
  @IsArray() @ArrayMinSize(1, { message: 'Escolha pelo menos um canal' }) @IsIn(['WHATSAPP', 'EMAIL'], { each: true }) canais: ('WHATSAPP' | 'EMAIL')[];
  @ApiProperty({ enum: ESTADOS_PARTICIPANTE, isArray: true, description: 'Estados dos participantes a incluir' })
  @IsArray() @ArrayMinSize(1) @IsIn(ESTADOS_PARTICIPANTE as unknown as string[], { each: true }) estados: string[];
  @ApiPropertyOptional({ type: [String], description: 'Restringe a estes participantes' })
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) participanteIds?: string[];
  @ApiProperty({ description: 'Confirmação explícita do envio (true). Sem isto só é feita a pré-visualização.' })
  @IsOptional() @IsBoolean() confirmar?: boolean;
}

export class PartilharComLeadsDto {
  @ApiPropertyOptional() @vazioParaUndefined() @IsOptional() @IsString() @MaxLength(1000) mensagem?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() estado?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() origem?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() unidadeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() confirmar?: boolean;
}
