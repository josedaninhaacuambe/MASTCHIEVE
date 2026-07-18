import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { FeedbackProcessor } from './processors/feedback.processor';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'feedback',
      defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    }),
    EmailModule,
  ],
  controllers: [AiController],
  providers: [AiService, FeedbackProcessor],
  exports: [AiService],
})
export class AiModule {}
