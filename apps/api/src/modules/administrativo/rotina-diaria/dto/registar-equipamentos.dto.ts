import { IsString, IsInt, Min, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EquipamentoItemDto {
  @ApiProperty() @IsString() item: string;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(0) quantidade: number;
}

export class RegistarEquipamentosDto {
  // Enviado via multipart/form-data junto com a foto — chega como string JSON, não como array nativo
  @ApiProperty({ type: [EquipamentoItemDto] })
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EquipamentoItemDto)
  itens: EquipamentoItemDto[];
}
