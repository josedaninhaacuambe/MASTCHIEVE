import { IsEnum, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleValues } from '../../../auth/dto/register.dto';

export class ConfigurarPermissoesDto {
  @ApiProperty({ enum: RoleValues }) @IsEnum(RoleValues) role: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
}
