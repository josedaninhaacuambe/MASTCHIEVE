import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DefinirPasswordConviteDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A password tem de ter pelo menos 8 caracteres' })
  @MaxLength(100)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'A password tem de ter letras e números' })
  password: string;
}
