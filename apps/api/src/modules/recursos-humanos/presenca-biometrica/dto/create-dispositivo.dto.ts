import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDispositivoDto {
  @ApiProperty() @IsString() nome: string;
  @ApiProperty() @IsString() unidadeId: string;
}
