import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebauthnConfig {
  constructor(private configService: ConfigService) {}

  get rpName(): string {
    return this.configService.get<string>('WEBAUTHN_RP_NAME', 'Mastchieve IA');
  }

  get rpID(): string {
    const configured = this.configService.get<string>('WEBAUTHN_RP_ID');
    if (configured) return configured;
    return new URL(this.frontendUrl).hostname;
  }

  get origin(): string {
    return this.configService.get<string>('WEBAUTHN_ORIGIN') || this.frontendUrl;
  }

  private get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:4300');
  }
}
