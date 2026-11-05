import { IsEmail, IsIn, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const RoleValues = ['ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT', 'FINANCIAL', 'MANAGER', 'VISITOR', 'GESTOR_RH', 'SUPER_ADMIN'] as const;
// A rota de registo é pública: perfis com mais permissões só são criados por quem já gere o sistema.
export const PublicRoleValues = ['STUDENT', 'INSTRUCTOR', 'VISITOR'] as const;
const GenderValues = ['MALE', 'FEMALE', 'OTHER'] as const;

export class RegisterDto {
  @ApiProperty({ example: 'admin@mastchieve.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: PublicRoleValues })
  @IsIn(PublicRoleValues, { message: 'Este perfil não está disponível no registo público' })
  role: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ enum: GenderValues })
  @IsOptional()
  @IsEnum(GenderValues)
  gender?: string;
}

export class RegisterVisitorDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}
