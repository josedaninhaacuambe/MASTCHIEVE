import { Controller, Get, Patch, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService, private gateway: NotificationsGateway) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do utilizador' })
  getMyNotifications(@CurrentUser('id') userId: string, @Query() q: any) {
    return this.service.getUserNotifications(userId, Number(q.page) || 1, Number(q.limit) || 20);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  markAllRead(@CurrentUser('id') userId: string) { return this.service.markAllRead(userId); }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  markRead(@Param('id') id: string) { return this.service.markRead(id); }

  @Post('bulk')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Enviar notificação em massa' })
  sendBulk(@Body() body: { title: string; body: string; type: string; target: string }) {
    return this.service.sendBulk(body, this.gateway);
  }

  // ── Push subscription endpoints ─────────────────────────────────────────

  @Get('push/vapid-public-key')
  @ApiOperation({ summary: 'Obter VAPID public key para Web Push' })
  getVapidPublicKey() { return this.service.getVapidPublicKey(); }

  @Post('push/subscribe')
  @ApiOperation({ summary: 'Registar push subscription' })
  subscribe(@CurrentUser('id') userId: string, @Body() dto: { endpoint: string; p256dh: string; auth: string }) {
    return this.service.subscribePush(userId, dto);
  }

  @Delete('push/unsubscribe')
  @ApiOperation({ summary: 'Remover push subscription' })
  unsubscribe(@CurrentUser('id') userId: string, @Body() dto: { endpoint: string }) {
    return this.service.unsubscribePush(userId, dto.endpoint);
  }
}
