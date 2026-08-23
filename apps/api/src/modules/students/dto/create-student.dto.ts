import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsArray, IsEmail, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const GenderValues = ['MALE', 'FEMALE', 'OTHER'] as const;

export class GuardianDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsString() phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() relationship?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class CreateStudentDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsDateString() dateOfBirth: string;
  @ApiProperty({ enum: GenderValues }) @IsEnum(GenderValues) gender: string;
  @ApiPropertyOptional({ description: 'Opcional — sem email, é gerado um acesso automático' }) @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() unidadeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() medicalNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyContact?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autorizacaoImagem?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() autorizacaoImagemDoc?: string;
  @ApiPropertyOptional({ type: [GuardianDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians?: GuardianDto[];
}
