import { Controller, Get, Put, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('whatsapp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private service: WhatsappService) {}

  @Get()
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar mensagens da fila de WhatsApp' })
  findAll(@Query('estado') estado?: string) {
    return this.service.findAll(estado);
  }

  @Put(':id/enviada')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Marcar mensagem como enviada' })
  marcarEnviada(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.marcarEnviada(id, userId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Cancelar mensagem pendente' })
  cancelar(@Param('id') id: string) {
    return this.service.cancelar(id);
  }
}
