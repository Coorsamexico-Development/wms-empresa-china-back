import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundController } from './inbound.controller';
import { InboundService } from './inbound.service';
import {
  Recepcion,
  RecepcionAtributo,
  EvidenciaRecepcion,
  CatalogoAtributo,
  CatalogoTipoEvidencia,
  MaestroMateriales,
  Tarima,
} from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recepcion,
      RecepcionAtributo,
      EvidenciaRecepcion,
      CatalogoAtributo,
      CatalogoTipoEvidencia,
      MaestroMateriales,
      Tarima,
    ]),
  ],
  controllers: [InboundController],
  providers: [InboundService],
  exports: [InboundService],
})
export class InboundModule {}
