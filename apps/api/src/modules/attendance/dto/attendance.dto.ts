import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
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
