import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateMovimentoDto } from './dto/create-movimento.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('inventario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventario')
export class InventarioController {
  constructor(private service: InventarioService) {}

  @Get('itens')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar itens de inventário' })
  findAllItens(@Query() query: any) {
    return this.service.findAllItens(query);
  }

  @Get('alertas')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar itens abaixo do stock mínimo' })
  findAlertas() {
    return this.service.findAlertas();
  }

  @Get('movimentos')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar movimentos de inventário' })
  findMovimentos(@Query() query: any) {
    return this.service.findMovimentos(query);
  }

  @Get('itens/:id')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Obter item de inventário por ID' })
  findOneItem(@Param('id') id: string) {
    return this.service.findOneItem(id);
  }

  @Post('itens')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Criar item de inventário' })
  createItem(@Body() dto: CreateItemDto, @CurrentUser('id') userId: string) {
    return this.service.createItem(dto, userId);
  }

  @Put('itens/:id')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Atualizar item de inventário' })
  updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto, @CurrentUser('id') userId: string) {
    return this.service.updateItem(id, dto, userId);
  }

  @Post('itens/:id/movimento')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Registar movimento de entrada/saída/ajuste de stock' })
  registarMovimento(@Param('id') id: string, @Body() dto: CreateMovimentoDto, @CurrentUser('id') userId: string) {
    return this.service.registarMovimento(id, dto, userId);
  }
}
