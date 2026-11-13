import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewFeedbackDto {
  @ApiProperty() @IsString() instructorNotes: string;
  @ApiProperty() @IsOptional() @IsBoolean() approve: boolean;
}

/** Feedback escrito pelo instrutor, sem IA. */
export class CreateFeedbackManualDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  studentId: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(10000)
  texto: string;
}

export class EditarTextoFeedbackDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(10000)
  texto: string;
}
