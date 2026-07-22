import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PaletizadoService } from './paletizado.service';
import { CreateTarimaDto, AddDetalleTarimaDto, CierreTarimaDto } from './dto/paletizado.dto';

@Controller('api/paletizado')
export class PaletizadoController {
  constructor(private readonly paletizadoService: PaletizadoService) {}

  @Post('tarimas')
  crearTarima(@Body() dto: CreateTarimaDto) {
    return this.paletizadoService.crearTarima(dto);
  }

  @Get('tarimas/:id')
  obtenerTarima(@Param('id', ParseIntPipe) id: number) {
    return this.paletizadoService.obtenerTarimaPorId(id);
  }

  @Delete('tarimas/:id')
  eliminarTarima(@Param('id', ParseIntPipe) id: number) {
    return this.paletizadoService.eliminarTarima(id);
  }

  @Get('recepcion/:recepcionId')
  listarTarimasPorRecepcion(@Param('recepcionId', ParseIntPipe) recepcionId: number) {
    return this.paletizadoService.listarTarimasPorRecepcion(recepcionId);
  }

  @Post('tarimas/:id/detalles')
  agregarDetalle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddDetalleTarimaDto,
  ) {
    return this.paletizadoService.agregarDetalle(id, dto);
  }

  @Delete('detalles/:detalleId')
  eliminarDetalle(@Param('detalleId', ParseIntPipe) detalleId: number) {
    return this.paletizadoService.eliminarDetalle(detalleId);
  }

  @Post('tarimas/:id/cierre')
  cerrarTarima(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CierreTarimaDto,
  ) {
    return this.paletizadoService.cerrarTarima(id, dto);
  }

  @Get('tarimas/:id/etiqueta/zpl')
  obtenerZPL(@Param('id', ParseIntPipe) id: number) {
    return this.paletizadoService.generarZPL(id);
  }

  @Get('tarimas/:id/etiqueta/pdf')
  async descargarPDF(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdfBuffer = await this.paletizadoService.generarPDFBuffer(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=etiqueta_lpn_${id}.pdf`);
    res.send(pdfBuffer);
  }
}
