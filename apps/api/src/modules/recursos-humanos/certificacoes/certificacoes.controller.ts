import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CertificacoesService } from './certificacoes.service';
import { CreateCertificacaoDto } from './dto/create-certificacao.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-certificacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/certificacoes')
export class CertificacoesController {
  constructor(private certificacoesService: CertificacoesService) {}

  @Get('funcionario/:funcionarioId')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar certificações de um funcionário' })
  findByFuncionario(@Param('funcionarioId') funcionarioId: string) {
    return this.certificacoesService.findByFuncionario(funcionarioId);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Registar certificação de funcionário' })
  create(@Body() dto: CreateCertificacaoDto, @CurrentUser('id') userId: string) {
    return this.certificacoesService.create(dto, userId);
  }

  @Put(':id/revogar')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Revogar certificação' })
  revogar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.certificacoesService.revogar(id, userId);
  }
}
