import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Tarima,
  DetalleTarima,
  EvidenciaTarima,
  Recepcion,
  MaestroMateriales,
} from '../../entities';
import { PaletizadoService } from './paletizado.service';
import { PaletizadoController } from './paletizado.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tarima,
      DetalleTarima,
      EvidenciaTarima,
      Recepcion,
      MaestroMateriales,
    ]),
  ],
  controllers: [PaletizadoController],
  providers: [PaletizadoService],
  exports: [PaletizadoService],
})
export class PaletizadoModule {}
