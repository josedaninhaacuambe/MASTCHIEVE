import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { PrismaService } from '../../../config/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { WebauthnConfig } from './webauthn.config';
import { WebauthnRegistoOptionsDto } from './dto/webauthn-registo-options.dto';
import { WebauthnRegistoVerifyDto } from './dto/webauthn-registo-verify.dto';
import { RegistrarUsbTemplateDto } from './dto/registrar-usb-template.dto';

const CHALLENGE_TTL_SECONDS = 120;

@Injectable()
export class CredenciaisService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private webauthnConfig: WebauthnConfig,
  ) {}

  async gerarOpcoesRegisto(userId: string, dto: WebauthnRegistoOptionsDto) {
    const funcionario = await this.getFuncionarioByUserId(userId);
    const dispositivo = await this.prisma.dispositivoQuiosque.findUnique({ where: { id: dto.dispositivoId } });
    if (!dispositivo || !dispositivo.ativo) throw new NotFoundException('Dispositivo não encontrado ou inativo');

    const existentes = await this.prisma.credencialBiometrica.findMany({
      where: { funcionarioId: funcionario.id, dispositivoId: dto.dispositivoId, tipo: 'WEBAUTHN', ativo: true },
    });

    const options = await generateRegistrationOptions({
      rpName: this.webauthnConfig.rpName,
      rpID: this.webauthnConfig.rpID,
      userName: `${funcionario.firstName} ${funcionario.lastName}`,
      userID: new TextEncoder().encode(funcionario.id),
      userDisplayName: `${funcionario.firstName} ${funcionario.lastName}`,
      attestationType: 'none',
      excludeCredentials: existentes
        .filter((c) => c.credentialId)
        .map((c) => ({
          id: c.credentialId as string,
          transports: c.transports ? JSON.parse(c.transports) : undefined,
        })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
        authenticatorAttachment: 'platform',
      },
    });

    await this.redis.setWithTtl(
      `webauthn:reg:${funcionario.id}:${dto.dispositivoId}`,
      options.challenge,
      CHALLENGE_TTL_SECONDS,
    );

    return options;
  }

  async verificarRegisto(userId: string, dto: WebauthnRegistoVerifyDto) {
    const funcionario = await this.getFuncionarioByUserId(userId);
    const dispositivo = await this.prisma.dispositivoQuiosque.findUnique({ where: { id: dto.dispositivoId } });
    if (!dispositivo) throw new NotFoundException('Dispositivo não encontrado');

    const key = `webauthn:reg:${funcionario.id}:${dto.dispositivoId}`;
    const expectedChallenge = await this.redis.get(key);
    if (!expectedChallenge) {
      throw new BadRequestException('Desafio de registo expirado. Reinicie o processo.');
    }

    const verification = await verifyRegistrationResponse({
      response: dto.response,
      expectedChallenge,
      expectedOrigin: this.webauthnConfig.origin,
      expectedRPID: this.webauthnConfig.rpID,
    });

    await this.redis.del(key);

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Falha na verificação da impressão digital');
    }

    const { credential } = verification.registrationInfo;

    const credencial = await this.prisma.credencialBiometrica.create({
      data: {
        funcionarioId: funcionario.id,
        tipo: 'WEBAUTHN',
        dispositivoId: dto.dispositivoId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: BigInt(credential.counter),
        transports: credential.transports ? JSON.stringify(credential.transports) : null,
        deviceLabel: dto.deviceLabel,
      },
    });

    return {
      id: credencial.id,
      tipo: credencial.tipo,
      deviceLabel: credencial.deviceLabel,
      registadoEm: credencial.registadoEm,
    };
  }

  async registarUsbTemplate(userId: string, dto: RegistrarUsbTemplateDto) {
    const funcionario = await this.getFuncionarioByUserId(userId);
    const credencial = await this.prisma.credencialBiometrica.create({
      data: {
        funcionarioId: funcionario.id,
        tipo: 'USB_TEMPLATE',
        fabricante: dto.fabricante,
        templateData: Buffer.from(dto.templateBase64, 'base64'),
        templateFormato: dto.templateFormato,
      },
    });
    return {
      id: credencial.id,
      tipo: credencial.tipo,
      fabricante: credencial.fabricante,
      registadoEm: credencial.registadoEm,
    };
  }

  async listarPorFuncionario(user: any, funcionarioId: string) {
    await this.assertAcesso(user, funcionarioId);
    return this.listarCredenciais(funcionarioId);
  }

  async listarMinhas(userId: string) {
    const funcionario = await this.getFuncionarioByUserId(userId);
    return this.listarCredenciais(funcionario.id);
  }

  private listarCredenciais(funcionarioId: string) {
    return this.prisma.credencialBiometrica.findMany({
      where: { funcionarioId },
      select: {
        id: true,
        tipo: true,
        dispositivoId: true,
        deviceLabel: true,
        fabricante: true,
        ativo: true,
        registadoEm: true,
        ultimaUtilizacao: true,
        dispositivo: { select: { nome: true } },
      },
      orderBy: { registadoEm: 'desc' },
    });
  }

  async revogar(user: any, id: string) {
    const credencial = await this.prisma.credencialBiometrica.findUnique({ where: { id } });
    if (!credencial) throw new NotFoundException('Credencial não encontrada');
    await this.assertAcesso(user, credencial.funcionarioId);
    await this.prisma.credencialBiometrica.delete({ where: { id } });
    return { revogado: true };
  }

  private async getFuncionarioByUserId(userId: string) {
    const funcionario = await this.prisma.funcionario.findUnique({ where: { userId } });
    if (!funcionario) throw new NotFoundException('Funcionário não encontrado para este utilizador');
    return funcionario;
  }

  private async assertAcesso(user: any, funcionarioId: string) {
    if (user.role === 'GESTOR_RH' || user.role === 'SUPER_ADMIN') return;
    const funcionario = await this.prisma.funcionario.findUnique({ where: { userId: user.id } });
    if (!funcionario || funcionario.id !== funcionarioId) {
      throw new ForbiddenException('Sem permissão para aceder a estas credenciais');
    }
  }
}
