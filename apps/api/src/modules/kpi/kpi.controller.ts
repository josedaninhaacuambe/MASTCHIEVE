import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KpiService } from './kpi.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('kpi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kpi')
export class KpiController {
  constructor(private kpiService: KpiService) {}

  @Get('dashboard')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'KPIs do dashboard principal' })
  getDashboard() { return this.kpiService.getDashboardKpis(); }

  @Get('attendance')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Taxa de assiduidade' })
  getAttendance(@Query('days') days: number) { return this.kpiService.getAttendanceStats(days); }

  @Get('instructor-adoption')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Taxa de adoção pelos instrutores' })
  getAdoption() { return this.kpiService.getInstructorAdoptionRate(); }

  @Get('history')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Histórico de KPIs' })
  getHistory(@Query('days') days: number) { return this.kpiService.getKpiHistory(days); }

  @Get('students/:studentId/trend')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Tendência de desempenho do atleta' })
  getStudentTrend(@Param('studentId') studentId: string) {
    return this.kpiService.getStudentProgressTrend(studentId);
  }
}
