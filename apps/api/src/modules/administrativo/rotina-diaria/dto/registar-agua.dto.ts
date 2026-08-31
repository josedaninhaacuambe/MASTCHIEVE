import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AGUA_LIMITES } from '../../../../common/constants/agua-parametros.constants';

export class RegistarAguaDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(AGUA_LIMITES.temperatura.min)
  @Max(AGUA_LIMITES.temperatura.max)
  temperatura: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(AGUA_LIMITES.ph.min)
  @Max(AGUA_LIMITES.ph.max)
  ph: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(AGUA_LIMITES.cloro.min)
  @Max(AGUA_LIMITES.cloro.max)
  cloro: number;
}
