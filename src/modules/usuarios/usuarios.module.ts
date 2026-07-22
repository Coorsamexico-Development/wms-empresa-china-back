import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario, Rol } from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol]),
    JwtModule.register({ secret: process.env.JWT_SECRET || 'WMS_COORSA_SECRET_KEY_2026_PRODUCTION!' }),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
