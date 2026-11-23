import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsArray, IsEmail, IsUUID, ValidateNested, IsIn, MaxLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const GenderValues = ['MALE', 'FEMALE', 'OTHER'] as const;
/** Etiquetas de atleta. BM = colaborador / familiar do Banco de Moçambique (não usa pacotes de pagamento). */
export const ETIQUETAS_ATLETA = ['BM'] as const;

export class GuardianDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsString() phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() relationship?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
  @ApiPropertyOptional({ description: 'Email de acesso do encarregado — se já existir uma conta com este email, é reutilizada (ou ganha o perfil de Encarregado) em vez de gerar um erro de colisão' })
  @IsOptional() @IsEmail() email?: string;
}

export class CreateStudentDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsDateString() dateOfBirth: string;
  @ApiProperty({ enum: GenderValues }) @IsEnum(GenderValues) gender: string;
  @ApiPropertyOptional({ description: 'Email de acesso do próprio atleta — ignorado quando `guardians` é indicado (o menor fica sem conta própria, ligado à conta do encarregado); se não for dado, é gerado um acesso automático' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() unidadeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() medicalNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyContact?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autorizacaoImagem?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() autorizacaoImagemDoc?: string;
  @ApiPropertyOptional({ description: 'Pacote de frequência contratado; define o valor da mensalidade' })
  @IsOptional() @IsUUID() pacoteId?: string | null;
  @ApiPropertyOptional({ enum: ETIQUETAS_ATLETA, nullable: true, description: 'BM = Banco de Moçambique: o atleta não usa pacotes nem entra na geração automática de mensalidades' })
  @IsOptional() @ValidateIf((_o, v) => v !== null) @IsIn(ETIQUETAS_ATLETA as unknown as string[]) etiqueta?: string | null;
  @ApiPropertyOptional({ description: 'Nome do trabalhador do BM a que o atleta está associado' })
  @IsOptional() @ValidateIf((_o, v) => v !== null) @IsString() @MaxLength(120) trabalhadorBm?: string | null;
  @ApiPropertyOptional({ description: 'Turma onde o atleta fica inscrito (tem de ser da mesma unidade)' })
  @IsOptional() @IsUUID() classId?: string;
  @ApiPropertyOptional({ description: 'Na inscrição: cria logo a mensalidade do mês corrente com o preço do pacote' })
  @IsOptional() @IsBoolean() gerarPrimeiraMensalidade?: boolean;
  @ApiPropertyOptional({ type: [GuardianDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians?: GuardianDto[];
}
