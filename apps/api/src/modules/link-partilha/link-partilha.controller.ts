import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { LinkPartilhaService } from './link-partilha.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

class UpdateLinkPartilhaDto {
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() label?: string;
}

@ApiTags('link-partilha')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('link-partilha')
export class LinkPartilhaController {
  constructor(private service: LinkPartilhaService) {}

  @Get()
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Listar links de partilha (Central de Partilha)' })
  findAll() {
    return this.service.findAll();
  }

  @Put(':chave')
  @Roles('ADMIN', 'ASSISTENTE_ADMIN')
  @ApiOperation({ summary: 'Atualizar URL/label de um link de partilha' })
  update(@Param('chave') chave: string, @Body() dto: UpdateLinkPartilhaDto) {
    return this.service.update(chave, dto);
  }
}
