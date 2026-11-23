import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InscreverFormacaoDto {
  @ApiProperty() @IsUUID() funcionarioId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) observacoes?: string;
}

/** Correcção de uma inscrição: observações e/ou estado (inscrito ↔ desistiu). */
export class ActualizarInscricaoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) observacoes?: string;
  @ApiPropertyOptional({ enum: ['INSCRITO', 'DESISTIU'] }) @IsOptional() @IsIn(['INSCRITO', 'DESISTIU']) estado?: 'INSCRITO' | 'DESISTIU';
}

export class CancelarInscricaoDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(1000) motivo: string;
}

/** Alterar a capacidade. null remove o limite. */
export class DefinirVagasDto {
  @ApiProperty({ nullable: true })
  @ValidateIf((o) => o.vagas !== null)
  @IsInt() @Min(1) @Max(1000)
  vagas: number | null;
}
