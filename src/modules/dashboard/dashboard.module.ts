import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Recepcion, Tarima, DetalleTarima, SalidaDespacho } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Recepcion, Tarima, DetalleTarima, SalidaDespacho])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
