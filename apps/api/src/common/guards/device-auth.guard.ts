import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../config/prisma/prisma.service';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const deviceId = request.headers['x-device-id'];
    const deviceKey = request.headers['x-device-key'];

    if (!deviceId || !deviceKey) {
      throw new UnauthorizedException('Credenciais de dispositivo em falta');
    }

    const device = await this.prisma.dispositivoQuiosque.findUnique({
      where: { id: deviceId },
    });

    if (!device || !device.ativo) {
      throw new UnauthorizedException('Dispositivo inválido ou inativo');
    }

    const isValid = await bcrypt.compare(deviceKey, device.chaveHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciais de dispositivo inválidas');
    }

    request.device = device;

    this.prisma.dispositivoQuiosque
      .update({ where: { id: device.id }, data: { ultimoAcesso: new Date() } })
      .catch(() => undefined);

    return true;
  }
}
