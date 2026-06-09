import { Module } from '@nestjs/common';
import { SwimmingModulesController } from './swimming-modules.controller';
import { SwimmingModulesService } from './swimming-modules.service';

@Module({
  controllers: [SwimmingModulesController],
  providers: [SwimmingModulesService],
  exports: [SwimmingModulesService],
})
export class SwimmingModulesModule {}
