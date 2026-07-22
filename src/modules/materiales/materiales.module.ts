import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialesService } from './materiales.service';
import { MaterialesController } from './materiales.controller';
import { MaestroMateriales, DetalleTarima } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([MaestroMateriales, DetalleTarima])],
  controllers: [MaterialesController],
  providers: [MaterialesService],
  exports: [MaterialesService],
})
export class MaterialesModule {}
