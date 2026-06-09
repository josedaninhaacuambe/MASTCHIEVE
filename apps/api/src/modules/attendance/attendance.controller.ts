import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BulkAttendanceDto } from './dto/attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Post('sessions/:sessionId/bulk')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Marcar presenças em massa para uma sessão' })
  markBulk(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
    @Body() dto: BulkAttendanceDto,
  ) {
    return this.service.markBulk(sessionId, user, dto.records);
  }

  @Get('sessions/:sessionId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Obter presenças de uma sessão' })
  getSession(@Param('sessionId') sessionId: string) {
    return this.service.getSessionAttendance(sessionId);
  }

  @Get('me')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Presenças do atleta autenticado' })
  getMyAttendance(@CurrentUser('id') userId: string) {
    return this.service.getMyAttendance(userId);
  }

  @Get('students/:studentId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Historial de presenças do atleta' })
  getStudent(@Param('studentId') studentId: string) {
    return this.service.getStudentAttendance(studentId);
  }
}
