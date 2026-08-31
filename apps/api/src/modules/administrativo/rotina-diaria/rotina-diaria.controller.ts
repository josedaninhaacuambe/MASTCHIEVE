import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { RotinaDiariaService } from './rotina-diaria.service';
import { CreateRotinaDto } from './dto/create-rotina.dto';
import { UpdateRotinaDto } from './dto/update-rotina.dto';
import { RegistarAguaDto } from './dto/registar-agua.dto';
import { RegistarEquipamentosDto } from './dto/registar-equipamentos.dto';
import { RegistarMaterialDto } from './dto/registar-material.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { imageStorage, imageFileFilter } from '../../../common/utils/upload.util';

const fotoInterceptor = FileInterceptor('foto', { storage: imageStorage, fileFilter: imageFileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

@ApiTags('rotina-diaria')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rotina-diaria')
export class RotinaDiariaController {
  constructor(private service: RotinaDiariaService) {}

  @Get('hoje')
  @Roles('INSTRUCTOR')
  @ApiOperation({ summary: 'Estado da rotina diária de abertura de hoje para o instrutor autenticado' })
  getStatusInstrutor(@CurrentUser('id') userId: string) {
    return this.service.getStatusInstrutor(userId);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar rotinas diárias de abertura/fecho' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Obter rotina diária por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/agua')
  @Roles('INSTRUCTOR')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(fotoInterceptor)
  @ApiOperation({ summary: 'Instrutor regista temperatura/pH/cloro medidos, com foto obrigatória' })
  registarAgua(
    @Param('id') id: string,
    @Body() dto: RegistarAguaDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) throw new BadRequestException('Foto da medição é obrigatória');
    return this.service.registarAgua(id, userId, dto, `/uploads/${file.filename}`);
  }

  @Post(':id/equipamentos')
  @Roles('INSTRUCTOR')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(fotoInterceptor)
  @ApiOperation({ summary: 'Instrutor regista quantidades de equipamentos de segurança, com foto obrigatória' })
  registarEquipamentos(
    @Param('id') id: string,
    @Body() dto: RegistarEquipamentosDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) throw new BadRequestException('Foto dos equipamentos é obrigatória');
    return this.service.registarEquipamentos(id, userId, dto, `/uploads/${file.filename}`);
  }

  @Post(':id/materiais')
  @Roles('INSTRUCTOR')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(fotoInterceptor)
  @ApiOperation({ summary: 'Instrutor acrescenta um item de material de aula preparado (pessoal)' })
  registarMaterial(
    @Param('id') id: string,
    @Body() dto: RegistarMaterialDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.registarMaterial(id, userId, dto, file ? `/uploads/${file.filename}` : null);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Iniciar checklist de rotina diária' })
  create(@Body() dto: CreateRotinaDto, @CurrentUser('id') userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Atualizar checklist de rotina diária' })
  update(@Param('id') id: string, @Body() dto: UpdateRotinaDto, @CurrentUser('id') userId: string) {
    return this.service.update(id, dto, userId);
  }
}
