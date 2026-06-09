import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SwimmingModulesService } from './swimming-modules.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateSwimmingModuleDto, UpdateProgressDto } from './dto/swimming-module.dto';

@ApiTags('swimming-modules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('swimming-modules')
export class SwimmingModulesController {
  constructor(private service: SwimmingModulesService) {}

  @Get()
  @Roles('ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT')
  @ApiOperation({ summary: 'Listar todos os módulos de natação' })
  findAll(@Query() query: any) { return this.service.findAll(query); }

  @Get('students/:studentId/progress')
  @Roles('ADMIN', 'INSTRUCTOR', 'STUDENT')
  @ApiOperation({ summary: 'Progressão do atleta em todos os módulos' })
  getProgress(@Param('studentId') studentId: string) {
    return this.service.getStudentProgress(studentId);
  }

  @Get(':id')
  @Roles('ADMIN', 'INSTRUCTOR', 'STUDENT')
  @ApiOperation({ summary: 'Detalhes de um módulo' })
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar módulo de natação' })
  create(@Body() dto: CreateSwimmingModuleDto) { return this.service.create(dto); }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar módulo' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateSwimmingModuleDto>) {
    return this.service.update(id, dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar parcialmente módulo (ex: order)' })
  patch(@Param('id') id: string, @Body() dto: Partial<CreateSwimmingModuleDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Arquivar módulo' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Post(':id/videos')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Adicionar vídeo a um módulo' })
  addVideo(
    @Param('id') id: string,
    @Body() body: { title: string; url: string; description?: string },
  ) {
    return this.service.addVideo(id, body);
  }

  @Delete(':id/videos/:videoId')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Remover vídeo de um módulo' })
  removeVideo(@Param('id') id: string, @Param('videoId') videoId: string) {
    return this.service.removeVideo(id, videoId);
  }

  @Patch('students/:studentId/modules/:moduleId/progress')
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Atualizar progressão do atleta num módulo' })
  updateProgress(
    @Param('studentId') studentId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.service.updateProgress(studentId, moduleId, dto);
  }
}
