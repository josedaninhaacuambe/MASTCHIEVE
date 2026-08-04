import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewFeedbackDto {
  @ApiProperty() @IsString() instructorNotes: string;
  @ApiProperty() approve: boolean;
}
