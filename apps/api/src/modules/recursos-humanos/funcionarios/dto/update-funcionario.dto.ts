import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { CreateFuncionarioDto } from './create-funcionario.dto';

export class UpdateFuncionarioDto extends PartialType(OmitType(CreateFuncionarioDto, ['email', 'password'] as const)) {
  @IsOptional() @IsString() @MinLength(6) newPassword?: string;
}
