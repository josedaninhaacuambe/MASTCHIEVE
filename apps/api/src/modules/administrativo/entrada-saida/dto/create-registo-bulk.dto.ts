import { IsArray, ArrayMinSize, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoRegistoBulkValues = ['ENTRADA', 'SAIDA'] as const;

export class BulkRegistoDto {
  @ApiProperty({ type: [String] })
  @IsArray() @ArrayMinSize(1) @IsString({ each: true })
  studentIds: string[];

  @ApiProperty({ enum: TipoRegistoBulkValues })
  @IsEnum(TipoRegistoBulkValues)
  tipo: string;

  @ApiPropertyOptional({ description: 'Opcional — aplicada a todos os alunos selecionados quando tipo=SAIDA' })
  @IsOptional() @IsString() justificativa?: string;

  @ApiPropertyOptional({ description: 'Hora real do registo, se for lançado mais tarde. Sem valor, usa a hora actual.' })
  @IsOptional() @IsDateString() dataHora?: string;
}
