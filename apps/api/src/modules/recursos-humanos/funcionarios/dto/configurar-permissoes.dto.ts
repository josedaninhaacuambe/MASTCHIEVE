import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleValues } from '../../../auth/dto/register.dto';

export class ConfigurarPermissoesDto {
  @ApiProperty({ enum: RoleValues }) @IsEnum(RoleValues) role: string;
}
