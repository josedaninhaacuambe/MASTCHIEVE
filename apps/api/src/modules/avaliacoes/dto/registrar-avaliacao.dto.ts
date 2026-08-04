import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export class CriterioAvaliacaoInputDto {
  @ApiProperty() @IsInt() @Min(0) criterioIndex: number;
  @ApiProperty() @IsInt() @Min(1) @Max(5) valor: number;
}

export class RegistrarAvaliacaoDto {
  @ApiProperty({ enum: ['DIARIA', 'AGENDADA'] })
  @IsIn(['DIARIA', 'AGENDADA'])
  tipo: 'DIARIA' | 'AGENDADA';

  @ApiProperty() @IsUUID() studentId: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() sessaoAgendadaId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() classSessionId?: string;

  @ApiProperty({ type: [CriterioAvaliacaoInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioAvaliacaoInputDto)
  avaliacoes: CriterioAvaliacaoInputDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
}
