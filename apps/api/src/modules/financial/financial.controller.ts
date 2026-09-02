import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('financial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('financial')
export class FinancialController {
  constructor(private service: FinancialService) {}

  @Get('me')
  @Roles('STUDENT', 'PARENT')
  @ApiOperation({ summary: 'Pagamentos do atleta autenticado' })
  getMyPayments(@CurrentUser('id') userId: string, @Query() q: any) {
    return this.service.getMyPayments(userId, q);
  }

  @Get('payments')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar pagamentos' })
  getPayments(@Query() query: any) { return this.service.getPayments(query); }

  @Post('payments')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Criar pagamento' })
  createPayment(@Body() dto: any, @CurrentUser('id') userId: string) { return this.service.createPayment(dto, userId); }

  @Patch('payments/:id/pay')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Marcar pagamento como pago' })
  markAsPaid(@Param('id') id: string, @Body('method') method: string, @CurrentUser('id') userId: string) {
    return this.service.markAsPaid(id, method, userId);
  }

  @Patch('payments/:id/isencao')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Conceder isenção de pagamento (segregação de funções — apenas ADMIN)' })
  grantIsencao(@Param('id') id: string, @Body('motivo') motivo: string, @CurrentUser('id') userId: string) {
    return this.service.grantIsencao(id, motivo, userId);
  }

  @Post('monthly-fees/generate')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Gerar mensalidades para todos os atletas ativos' })
  generateMonthlyFees(@Body() body: { month: number; year: number; amount: number }) {
    return this.service.generateMonthlyFees(body.month, body.year, body.amount);
  }

  @Post('monthly-fees/student/:studentId')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Gerar mensalidade para um atleta específico' })
  createMonthlyFeeForStudent(
    @Param('studentId') studentId: string,
    @Body() body: { month: number; year: number; amount: number },
  ) {
    return this.service.createMonthlyFeeForStudent(studentId, body.month, body.year, body.amount);
  }

  @Get('caixa')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar conferências de caixa' })
  listCashCounts(@Query('unidadeId') unidadeId?: string) {
    return this.service.listCashCounts(unidadeId);
  }

  @Post('caixa')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Registar conferência de caixa' })
  registerCashCount(
    @Body() body: { unidadeId?: string; data?: string; valorContado: number; observacoes?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.service.registerCashCount(body, userId);
  }

  @Get('summary')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Resumo financeiro anual' })
  getSummary(@Query('year') year: number) {
    return this.service.getFinancialSummary(year || new Date().getFullYear());
  }

  @Get('students/:studentId/balance')
  @Roles('ADMIN', 'INSTRUCTOR', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Saldo do atleta' })
  getStudentBalance(@Param('studentId') studentId: string) {
    return this.service.getStudentBalance(studentId);
  }

  @Post('send-reminders')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Enviar lembretes de pagamento por email' })
  sendReminders() {
    return this.service.sendReminders();
  }

  @Get('export')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Exportar relatório financeiro em PDF' })
  async exportPdf(@Query('year') year: string, @Res() res: Response) {
    const y = parseInt(year) || new Date().getFullYear();
    const buffer = await this.service.exportPdf(y);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="mastchieve-financeiro-${y}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
