import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
  MaestroMateriales,
  CatalogoAtributo,
  CatalogoTipoEvidencia,
  Rol,
  Usuario,
  Recepcion,
  RecepcionAtributo,
  EvidenciaRecepcion,
  Tarima,
  DetalleTarima,
  EvidenciaTarima,
  SalidaDespacho,
  SalidaAtributo,
  DetalleSalida,
  EvidenciaSalida,
} from '../entities';
import { SeedService } from './seed.service';

const entities = [
  MaestroMateriales,
  CatalogoAtributo,
  CatalogoTipoEvidencia,
  Rol,
  Usuario,
  Recepcion,
  RecepcionAtributo,
  EvidenciaRecepcion,
  Tarima,
  DetalleTarima,
  EvidenciaTarima,
  SalidaDespacho,
  SalidaAtributo,
  DetalleSalida,
  EvidenciaSalida,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3307', 10),
        username: process.env.DB_USER || 'wms_user',
        password: process.env.DB_PASSWORD || 'wms_password',
        database: process.env.DB_NAME || 'wms_db',
        entities,
        synchronize: true,
        retryAttempts: 5,
        retryDelay: 3000,
        autoLoadEntities: true,
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
