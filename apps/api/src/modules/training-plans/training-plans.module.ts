import { Module } from '@nestjs/common';
import { TrainingPlansController } from './training-plans.controller';

@Module({ controllers: [TrainingPlansController] })
export class TrainingPlansModule {}
