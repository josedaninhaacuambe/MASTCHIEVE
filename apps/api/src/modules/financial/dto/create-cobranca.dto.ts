import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, Min, Max, IsInt, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoCobrancaValues = ['MENSALIDADE', 'OUTRA'] as const;

/** Cobrança individual: um atleta, um valor e uma data de vencimento próprios. */
export class CreateCobrancaDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  studentId: string;

  @ApiProperty({ description: 'Valor em MT' })
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(10_000_000)
  amount: number;

  @ApiProperty({ description: 'Data de vencimento (AAAA-MM-DD)' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ enum: TipoCobrancaValues, default: 'MENSALIDADE' })
  @IsOptional() @IsEnum(TipoCobrancaValues)
  tipo?: (typeof TipoCobrancaValues)[number];

  @ApiPropertyOptional({ description: 'Mês de referência (1-12), obrigatório para MENSALIDADE' })
  @IsOptional() @IsInt() @Min(1) @Max(12)
  month?: number;

  @ApiPropertyOptional({ description: 'Ano de referência, obrigatório para MENSALIDADE' })
  @IsOptional() @IsInt() @Min(2000) @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Descrição (ex.: inscrição, equipamento, prova)' })
  @IsOptional() @IsString() @MaxLength(500)
  descricao?: string;
}
