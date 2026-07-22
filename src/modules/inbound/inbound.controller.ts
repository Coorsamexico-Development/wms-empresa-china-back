import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { InboundService } from './inbound.service';
import { CreateRecepcionDto, CreateEvidenciaDto } from './dto/create-recepcion.dto';

@Controller('api/inbound')
export class InboundController {
  constructor(private readonly inboundService: InboundService) {}

  @Get('atributos')
  getAtributos() {
    return this.inboundService.getAtributosActivos();
  }

  @Get('tipos-evidencia')
  getTiposEvidencia() {
    return this.inboundService.getTiposEvidencia();
  }

  @Get('materiales')
  buscarMateriales(@Query('q') q?: string) {
    return this.inboundService.buscarMateriales(q);
  }

  @Get('recepciones')
  listarRecepciones() {
    return this.inboundService.listarRecepciones();
  }

  @Get('recepciones/:id')
  obtenerRecepcion(@Param('id', ParseIntPipe) id: number) {
    return this.inboundService.obtenerRecepcionPorId(id);
  }

  @Post('recepciones')
  crearRecepcion(@Body() dto: CreateRecepcionDto) {
    return this.inboundService.crearRecepcion(dto);
  }

  @Post('recepciones/:id/cerrar')
  cerrarRecepcion(@Param('id', ParseIntPipe) id: number) {
    return this.inboundService.cerrarRecepcion(id);
  }

  @Post('recepciones/:id/evidencias')
  agregarEvidencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEvidenciaDto,
  ) {
    return this.inboundService.agregarEvidencia(id, dto);
  }
}
