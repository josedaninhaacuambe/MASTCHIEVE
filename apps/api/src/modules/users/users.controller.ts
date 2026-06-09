import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar utilizadores' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Patch(':id/toggle')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Ativar/desativar utilizador' })
  toggle(@Param('id') id: string) { return this.service.toggleActive(id); }

  @Patch(':id/role')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Alterar papel do utilizador' })
  changeRole(@Param('id') id: string, @Body('role') role: string) {
    return this.service.changeRole(id, role);
  }
}
