import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { PresencaQuiosqueService } from './presenca-quiosque.service';
import { KioskWebauthnVerifyDto } from './dto/kiosk-webauthn-verify.dto';
import { KioskUsbMarcarDto } from './dto/kiosk-usb-marcar.dto';
import { DeviceAuthGuard } from '../../../common/guards/device-auth.guard';
import { CurrentDevice } from '../../../common/decorators/current-device.decorator';

@ApiTags('rh-presenca-quiosque')
@ApiHeader({ name: 'X-Device-Id', required: true })
@ApiHeader({ name: 'X-Device-Key', required: true })
@UseGuards(DeviceAuthGuard)
@Controller('rh/presenca/quiosque')
export class PresencaQuiosqueController {
  constructor(private presencaQuiosqueService: PresencaQuiosqueService) {}

  @Post('webauthn/options')
  @ApiOperation({ summary: 'Gerar opções de autenticação WebAuthn para o quiosque' })
  gerarOpcoes(@CurrentDevice('id') dispositivoId: string) {
    return this.presencaQuiosqueService.gerarOpcoesAutenticacao(dispositivoId);
  }

  @Post('webauthn/verify')
  @ApiOperation({ summary: 'Verificar impressão digital e marcar presença' })
  verificar(@Body() dto: KioskWebauthnVerifyDto, @CurrentDevice('id') dispositivoId: string) {
    return this.presencaQuiosqueService.verificarAutenticacao(dispositivoId, dto);
  }

  @Post('usb/marcar')
  @ApiOperation({ summary: 'Marcar presença via leitor USB (scaffold)' })
  marcarUsb(@Body() dto: KioskUsbMarcarDto, @CurrentDevice('id') dispositivoId: string) {
    return this.presencaQuiosqueService.marcarUsb(dispositivoId, dto);
  }
}
