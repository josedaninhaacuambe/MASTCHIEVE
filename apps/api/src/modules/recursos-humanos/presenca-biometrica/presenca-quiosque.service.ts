import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { WebauthnConfig } from './webauthn.config';
import { KioskWebauthnVerifyDto } from './dto/kiosk-webauthn-verify.dto';
import { KioskUsbMarcarDto } from './dto/kiosk-usb-marcar.dto';

const CHALLENGE_TTL_SECONDS = 120;

@Injectable()
export class PresencaQuiosqueService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private webauthnConfig: WebauthnConfig,
  ) {}

  async gerarOpcoesAutenticacao(dispositivoId: string) {
    const options = await generateAuthenticationOptions({
      rpID: this.webauthnConfig.rpID,
      userVerification: 'required',
    });
    await this.redis.setWithTtl(`webauthn:auth:${dispositivoId}`, options.challenge, CHALLENGE_TTL_SECONDS);
    return options;
  }

  async verificarAutenticacao(dispositivoId: string, dto: KioskWebauthnVerifyDto) {
    const credentialId = dto.response?.id;
    if (!credentialId) throw new BadRequestException('Resposta WebAuthn inválida');

    const credencial = await this.prisma.credencialBiometrica.findUnique({ where: { credentialId } });
    if (!credencial || credencial.tipo !== 'WEBAUTHN' || !credencial.ativo) {
      throw new UnauthorizedException('Credencial biométrica não reconhecida');
    }
    if (credencial.dispositivoId !== dispositivoId) {
      throw new UnauthorizedException('Esta credencial não está registada neste quiosque');
    }

    const key = `webauthn:auth:${dispositivoId}`;
    const expectedChallenge = await this.redis.get(key);
    if (!expectedChallenge) throw new BadRequestException('Desafio expirado. Tente novamente.');

    const verification = await verifyAuthenticationResponse({
      response: dto.response,
      expectedChallenge,
      expectedOrigin: this.webauthnConfig.origin,
      expectedRPID: this.webauthnConfig.rpID,
      credential: {
        id: credencial.credentialId as string,
        publicKey: Buffer.from(credencial.publicKey as string, 'base64'),
        counter: Number(credencial.counter ?? 0),
        transports: credencial.transports ? JSON.parse(credencial.transports) : undefined,
      },
    });

    await this.redis.del(key);

    if (!verification.verified) {
      throw new UnauthorizedException('Falha na verificação da impressão digital');
    }

    await this.prisma.credencialBiometrica.update({
      where: { id: credencial.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter), ultimaUtilizacao: new Date() },
    });

    return this.marcarPresenca(credencial.funcionarioId, dispositivoId, 'WEBAUTHN');
  }

  async marcarUsb(dispositivoId: string, dto: KioskUsbMarcarDto) {
    const credencial = await this.prisma.credencialBiometrica.findFirst({
      where: { funcionarioId: dto.funcionarioId, tipo: 'USB_TEMPLATE', ativo: true },
    });
    if (!credencial) {
      throw new UnauthorizedException('Funcionário sem template de impressão digital USB registado');
    }

    await this.prisma.credencialBiometrica.update({
      where: { id: credencial.id },
      data: { ultimaUtilizacao: new Date() },
    });

    return this.marcarPresenca(dto.funcionarioId, dispositivoId, 'USB_TEMPLATE');
  }

  private async marcarPresenca(funcionarioId: string, dispositivoId: string, metodoVerificacao: string) {
    const dispositivo = await this.prisma.dispositivoQuiosque.findUnique({ where: { id: dispositivoId } });
    if (!dispositivo) throw new NotFoundException('Dispositivo não encontrado');

    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(inicioDia);
    fimDia.setDate(fimDia.getDate() + 1);

    const ultimoRegisto = await this.prisma.registoPresenca.findFirst({
      where: { funcionarioId, timestamp: { gte: inicioDia } },
      orderBy: { timestamp: 'desc' },
    });

    const tipo = !ultimoRegisto || ultimoRegisto.tipo === 'SAIDA' ? 'ENTRADA' : 'SAIDA';

    const escalaHoje = await this.prisma.escala.findFirst({
      where: { funcionarioId, data: { gte: inicioDia, lt: fimDia } },
      orderBy: { data: 'asc' },
    });

    const registo = await this.prisma.registoPresenca.create({
      data: {
        funcionarioId,
        dispositivoId,
        unidadeId: dispositivo.unidadeId,
        escalaId: escalaHoje?.id,
        tipo,
        metodoVerificacao,
      },
      include: { funcionario: { select: { firstName: true, lastName: true } } },
    });

    return {
      tipo: registo.tipo,
      timestamp: registo.timestamp,
      funcionario: registo.funcionario,
    };
  }
}
