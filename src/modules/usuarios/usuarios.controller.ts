import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto, CreateRolDto, LoginDto } from './dto/create-usuario.dto';

@Controller('api/usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.usuariosService.login(dto);
  }

  @Get()
  listarUsuarios() {
    return this.usuariosService.listarUsuarios();
  }

  @Get('roles')
  listarRoles() {
    return this.usuariosService.listarRoles();
  }

  @Post()
  crearUsuario(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.crearUsuario(dto);
  }

  @Post('roles')
  crearRol(@Body() dto: CreateRolDto) {
    return this.usuariosService.crearRol(dto);
  }
}
