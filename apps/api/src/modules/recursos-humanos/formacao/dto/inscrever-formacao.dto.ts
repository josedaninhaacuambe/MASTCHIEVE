import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InscreverFormacaoDto {
  @ApiProperty() @IsString() funcionarioId: string;
}
