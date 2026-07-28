import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CredenciaisService } from './credenciais.service';
import { WebauthnRegistoOptionsDto } from './dto/webauthn-registo-options.dto';
import { WebauthnRegistoVerifyDto } from './dto/webauthn-registo-verify.dto';
import { RegistrarUsbTemplateDto } from './dto/registrar-usb-template.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-presenca-credenciais')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rh/presenca/credenciais')
export class CredenciaisController {
  constructor(private credenciaisService: CredenciaisService) {}

  @Post('webauthn/registo/options')
  @ApiOperation({ summary: 'Gerar opções de registo WebAuthn para a própria impressão digital' })
  gerarOpcoesRegisto(@Body() dto: WebauthnRegistoOptionsDto, @CurrentUser('id') userId: string) {
    return this.credenciaisService.gerarOpcoesRegisto(userId, dto);
  }

  @Post('webauthn/registo/verify')
  @ApiOperation({ summary: 'Verificar e concluir registo WebAuthn' })
  verificarRegisto(@Body() dto: WebauthnRegistoVerifyDto, @CurrentUser('id') userId: string) {
    return this.credenciaisService.verificarRegisto(userId, dto);
  }

  @Post('usb')
  @ApiOperation({ summary: 'Registar template de leitor USB (scaffold, formato dependente do SDK do fabricante)' })
  registarUsb(@Body() dto: RegistrarUsbTemplateDto, @CurrentUser('id') userId: string) {
    return this.credenciaisService.registarUsbTemplate(userId, dto);
  }

  @Get('minhas')
  @ApiOperation({ summary: 'Listar as próprias credenciais biométricas' })
  listarMinhas(@CurrentUser('id') userId: string) {
    return this.credenciaisService.listarMinhas(userId);
  }

  @Get('funcionario/:funcionarioId')
  @ApiOperation({ summary: 'Listar credenciais biométricas de um funcionário' })
  listarPorFuncionario(@Param('funcionarioId') funcionarioId: string, @CurrentUser() user: any) {
    return this.credenciaisService.listarPorFuncionario(user, funcionarioId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revogar credencial biométrica' })
  revogar(@Param('id') id: string, @CurrentUser() user: any) {
    return this.credenciaisService.revogar(user, id);
  }
}
