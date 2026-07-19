import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FolhaPagamentoService } from './folha-pagamento.service';
import { CreateFolhaPagamentoDto } from './dto/create-folha-pagamento.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('rh-folha-pagamento')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh/folha-pagamento')
export class FolhaPagamentoController {
  constructor(private service: FolhaPagamentoService) {}

  @Get()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar folhas de pagamento' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Obter folha de pagamento por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Processar folha de pagamento do mês (fica pendente de aprovação)' })
  create(@Body() dto: CreateFolhaPagamentoDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id/aprovar')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Aprovar folha de pagamento' })
  aprovar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.aprovar(id, userId);
  }

  @Put(':id/rejeitar')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Rejeitar folha de pagamento' })
  rejeitar(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.rejeitar(id, userId);
  }

  @Put(':id/marcar-paga')
  @Roles('GESTOR_RH', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Marcar folha de pagamento como paga' })
  marcarPaga(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.marcarPaga(id, userId);
  }
}
