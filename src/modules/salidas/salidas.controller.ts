import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { SalidasService } from './salidas.service';
import { CreateSalidaDto, DespacharTarimasDto } from './dto/salidas.dto';

@Controller('api/salidas')
export class SalidasController {
  constructor(private readonly salidasService: SalidasService) {}

  @Get()
  listarSalidas() {
    return this.salidasService.listarSalidas();
  }

  @Get('tarimas-disponibles')
  obtenerTarimasDisponibles() {
    return this.salidasService.obtenerTarimasDisponibles();
  }

  @Get(':id')
  obtenerSalida(@Param('id', ParseIntPipe) id: number) {
    return this.salidasService.obtenerSalidaPorId(id);
  }

  @Post()
  crearSalida(@Body() dto: CreateSalidaDto) {
    return this.salidasService.crearSalida(dto);
  }

  @Post(':id/despachar')
  procesarDespacho(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DespacharTarimasDto,
  ) {
    return this.salidasService.procesarDespacho(id, dto);
  }
}
