import { IsString, IsOptional, IsEnum, IsInt, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CargoValues, DepartamentoValues } from '../../funcionarios/dto/create-funcionario.dto';

export class CreateVagaDto {
  @ApiProperty() @IsString() titulo: string;
  @ApiProperty({ enum: CargoValues }) @IsEnum(CargoValues) cargo: string;
  @ApiPropertyOptional({ enum: DepartamentoValues }) @IsOptional() @IsEnum(DepartamentoValues) departamento?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unidadeId?: string;
  @ApiProperty() @IsString() descricao: string;
  @ApiPropertyOptional() @IsOptional() @IsString() requisitos?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @IsInt() @Min(1) numeroVagas?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() orcamentoEstimado?: number;
}
