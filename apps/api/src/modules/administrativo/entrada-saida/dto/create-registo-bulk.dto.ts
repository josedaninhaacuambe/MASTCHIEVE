import { IsArray, ArrayMinSize, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TipoRegistoBulkValues = ['ENTRADA', 'SAIDA'] as const;

export class BulkRegistoDto {
  @ApiProperty({ type: [String] })
  @IsArray() @ArrayMinSize(1) @IsString({ each: true })
  studentIds: string[];

  @ApiProperty({ enum: TipoRegistoBulkValues })
  @IsEnum(TipoRegistoBulkValues)
  tipo: string;

  @ApiPropertyOptional({ description: 'Obrigatória quando tipo=SAIDA — aplicada a todos os alunos selecionados' })
  @IsOptional() @IsString() justificativa?: string;
}
