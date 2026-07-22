import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard } from './modules/auth/roles.guard';
import { InboundModule } from './modules/inbound/inbound.module';
import { PaletizadoModule } from './modules/paletizado/paletizado.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MaterialesModule } from './modules/materiales/materiales.module';
import { SalidasModule } from './modules/salidas/salidas.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    InboundModule,
    PaletizadoModule,
    DashboardModule,
    MaterialesModule,
    SalidasModule,
    UsuariosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

