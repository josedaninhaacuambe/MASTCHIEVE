import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AiService } from '../ai.service';

@Processor('feedback')
export class FeedbackProcessor {
  private readonly logger = new Logger(FeedbackProcessor.name);

  constructor(private aiService: AiService) {}

  @Process('generate-feedback')
  async handleFeedbackGeneration(job: Job<{ performanceRecordId: string }>) {
    this.logger.log(`Processing feedback job ${job.id} for record ${job.data.performanceRecordId}`);
    try {
      const feedback = await this.aiService.generateFeedback(job.data.performanceRecordId);
      this.logger.log(`Feedback job ${job.id} completed`);
      return { success: true, feedback };
    } catch (error) {
      this.logger.error(`Feedback job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }
}
