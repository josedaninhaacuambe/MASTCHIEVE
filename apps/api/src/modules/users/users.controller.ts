import { Controller, Get, Patch, Param, Query, Body, UseGuards, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SetMetadata } from '@nestjs/common';

const Public = () => SetMetadata('isPublic', true);

class UpdateMeDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() bio?: string;
}

class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(6) newPassword: string;
}

class ForgotPasswordDto {
  @IsEmail() email: string;
}

class ResetPasswordDto {
  @IsString() token: string;
  @IsString() @MinLength(6) newPassword: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Perfil do utilizador autenticado' })
  getMe(@CurrentUser('id') userId: string) { return this.service.getMe(userId); }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil próprio' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateMeDto) {
    return this.service.updateMe(userId, dto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Alterar palavra-passe' })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.service.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Redefinir senha com token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(dto.token, dto.newPassword);
  }

  @Get('audit-logs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar audit logs' })
  getAuditLogs(@Query() query: any) { return this.service.getAuditLogs(query); }

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
