import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class GenerateFeedbackDto {
  @ApiProperty() @IsString() performanceRecordId: string;
}

class GenerateTrainingPlanDto {
  @ApiPropertyOptional() @IsOptional() @IsString() instructorNotes?: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('feedback/queue')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Enfileirar geração de feedback (legado, registo de desempenho fixo)' })
  queueFeedback(@Body() dto: GenerateFeedbackDto) {
    return this.aiService.queueFeedbackGeneration({ performanceRecordId: dto.performanceRecordId });
  }

  @Post('feedback/generate/:recordId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Gerar feedback imediato (legado, registo de desempenho fixo)' })
  generateFeedback(@Param('recordId') recordId: string) {
    return this.aiService.generateFeedback({ performanceRecordId: recordId });
  }

  @Post('feedback/student/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Gerar feedback com IA a partir da avaliação mais recente do atleta' })
  generateFeedbackForStudent(@Param('studentId') studentId: string) {
    return this.aiService.generateFeedbackForStudent(studentId);
  }

  @Post('feedback/:feedbackId/regenerate')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Voltar a gerar com IA um feedback pendente' })
  regenerateFeedback(@Param('feedbackId') feedbackId: string) {
    return this.aiService.regenerateFeedback(feedbackId);
  }

  @Post('training-plan/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Gerar plano de treino com IA' })
  generateTrainingPlan(
    @Param('studentId') studentId: string,
    @Body() dto: GenerateTrainingPlanDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.generateTrainingPlan(studentId, dto.instructorNotes, userId);
  }
}

