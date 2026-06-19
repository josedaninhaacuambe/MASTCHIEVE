import { Controller, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ParentsService } from './parents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('parents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parents')
export class ParentsController {
  constructor(private service: ParentsService) {}

  @Get() @Roles('ADMIN') @ApiOperation({ summary: 'Listar encarregados' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('me') @Roles('PARENT') @ApiOperation({ summary: 'Perfil do encarregado autenticado' })
  findMe(@Request() req: any) { return this.service.findMe(req.user.userId); }

  @Get('me/children/:studentId') @Roles('PARENT') @ApiOperation({ summary: 'Detalhe de um filho' })
  getChildDetail(@Request() req: any, @Param('studentId') studentId: string) {
    return this.service.getChildDetail(req.user.userId, studentId);
  }

  @Get(':id') @Roles('ADMIN') @ApiOperation({ summary: 'Detalhe de encarregado' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id') @Roles('ADMIN', 'PARENT') @ApiOperation({ summary: 'Actualizar encarregado' })
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }
}
