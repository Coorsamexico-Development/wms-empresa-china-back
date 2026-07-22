import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { InboundModule } from './modules/inbound/inbound.module';
import { PaletizadoModule } from './modules/paletizado/paletizado.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MaterialesModule } from './modules/materiales/materiales.module';
import { SalidasModule } from './modules/salidas/salidas.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';

@Module({
  imports: [
    DatabaseModule,
    InboundModule,
    PaletizadoModule,
    DashboardModule,
    MaterialesModule,
    SalidasModule,
    UsuariosModule,
  ],
})
export class AppModule {}
