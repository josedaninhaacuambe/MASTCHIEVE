import {
  ArrayMinSize, IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export class AttendanceRecordDto {
  @ApiProperty() @IsUUID() studentId: string;
  @ApiProperty({ enum: AttendanceStatus }) @IsEnum(AttendanceStatus) status: AttendanceStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class BulkAttendanceDto {
  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];

  @ApiPropertyOptional({ type: [String], description: 'Instrutores que efectivamente leccionaram a aula' })
  @IsOptional() @IsArray() @IsUUID('all', { each: true })
  instructorIds?: string[];
}

export class SessionInstrutoresDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMinSize(1) @IsUUID('all', { each: true }) instructorIds: string[];
}

export class RegistarConvidadoDto {
  @ApiProperty() @IsUUID() studentId: string;
  @ApiPropertyOptional({ enum: AttendanceStatus }) @IsOptional() @IsEnum(AttendanceStatus) status?: AttendanceStatus;
  @ApiPropertyOptional({ description: 'Turma de origem (inscrição activa do atleta); por omissão é deduzida' })
  @IsOptional() @IsUUID() turmaOrigemId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() horaEntrada?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() horaSaida?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class HorarioPresencaDto {
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsDateString() horaEntrada?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsDateString() horaSaida?: string | null;
}

export enum MeioContacto {
  TELEFONE = 'TELEFONE',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  PRESENCIAL = 'PRESENCIAL',
}

export class CreateContactoFaltaDto {
  @ApiProperty() @IsUUID() studentId: string;
  @ApiProperty() @IsString() motivo: string;
  @ApiProperty() @IsInt() @Min(1) faltasConsecutivas: number;
  @ApiProperty({ enum: MeioContacto }) @IsEnum(MeioContacto) meioContacto: MeioContacto;
  @ApiPropertyOptional() @IsOptional() @IsString() resultado?: string;
}
