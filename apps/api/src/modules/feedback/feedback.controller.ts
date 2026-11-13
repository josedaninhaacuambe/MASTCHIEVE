import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateFeedbackManualDto, EditarTextoFeedbackDto, ReviewFeedbackDto } from './dto/feedback.dto';

@ApiTags('feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private service: FeedbackService) {}

  @Get('me')
  @Roles('STUDENT', 'PARENT')
  @ApiOperation({ summary: 'Feedbacks do atleta autenticado' })
  getMyFeedbacks(@CurrentUser('id') userId: string, @Query() q: any) {
    return this.service.getMyFeedbacks(userId, q);
  }

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Listar feedbacks' })
  getFeedbacks(@Query() query: any) { return this.service.getFeedbacks(query); }

  @Post()
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Escrever feedback manualmente (sem IA)' })
  createManual(@Body() dto: CreateFeedbackManualDto, @CurrentUser('id') userId: string) {
    return this.service.createManual(dto.studentId, dto.texto, userId);
  }

  @Patch(':id/texto')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Escrever ou corrigir o texto final do feedback' })
  editarTexto(@Param('id') id: string, @Body() dto: EditarTextoFeedbackDto, @CurrentUser('id') userId: string) {
    return this.service.editarTexto(id, dto.texto, userId);
  }

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
