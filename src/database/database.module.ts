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
      useFactory: () => {
        const socketPath = process.env.DB_SOCKET_PATH; // Ej: /cloudsql/project:region:instance
        const baseConfig = {
          type: 'mysql' as const,
          username: process.env.DB_USER || 'wms_user',
          password: process.env.DB_PASSWORD || 'wms_password',
          database: process.env.DB_NAME || 'wms_db',
          entities,
          synchronize: true,
          retryAttempts: 5,
          retryDelay: 3000,
          autoLoadEntities: true,
        };
        if (socketPath) {
          // Producción: Cloud SQL Auth Proxy vía Unix Socket
          return { ...baseConfig, extra: { socketPath } } as any;
        }
        // Desarrollo local: conexión TCP
        return {
          ...baseConfig,
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3307', 10),
        };
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
