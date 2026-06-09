import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RecordPerformanceDto, ReviewFeedbackDto } from './dto/feedback.dto';

@ApiTags('feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private service: FeedbackService) {}

  @Post('performance')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Registar desempenho e gerar feedback IA' })
  recordPerformance(@Body() dto: RecordPerformanceDto) { return this.service.recordPerformance(dto); }

  @Get('me')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Feedbacks do atleta autenticado' })
  getMyFeedbacks(@CurrentUser('id') userId: string, @Query() q: any) {
    return this.service.getMyFeedbacks(userId, q);
  }

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Listar feedbacks' })
  getFeedbacks(@Query() query: any) { return this.service.getFeedbacks(query); }

  @Patch(':id/review')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Rever e aprovar feedback' })
  reviewFeedback(
    @Param('id') id: string,
    @Body() dto: ReviewFeedbackDto,
  ) { return this.service.reviewFeedback(id, dto.instructorNotes, dto.approve); }

  @Post(':id/send')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Enviar feedback ao aluno/encarregado' })
  sendFeedback(@Param('id') id: string, @Request() req: any) {
    return this.service.sendFeedback(id, req.user?.id);
  }
}
