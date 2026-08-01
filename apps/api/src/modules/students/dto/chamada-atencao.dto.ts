import { IsNotEmpty, IsString } from 'class-validator';

export class ChamadaAtencaoDto {
  @IsString()
  @IsNotEmpty()
  mensagem: string;
}
