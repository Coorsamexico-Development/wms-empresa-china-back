import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalidasService } from './salidas.service';
import { SalidasController } from './salidas.controller';
import {
  SalidaDespacho,
  SalidaAtributo,
  DetalleSalida,
  EvidenciaSalida,
  Tarima,
} from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalidaDespacho,
      SalidaAtributo,
      DetalleSalida,
      EvidenciaSalida,
      Tarima,
    ]),
  ],
  controllers: [SalidasController],
  providers: [SalidasService],
  exports: [SalidasService],
})
export class SalidasModule {}
