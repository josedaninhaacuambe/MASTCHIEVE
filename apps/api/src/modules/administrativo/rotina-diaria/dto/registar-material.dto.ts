import { IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegistarMaterialDto {
  @ApiProperty() @IsString() item: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantidade: number;
}
