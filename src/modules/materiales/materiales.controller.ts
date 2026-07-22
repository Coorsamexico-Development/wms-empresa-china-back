import { Controller, Get, Post, Body, Query, Param, ParseIntPipe } from '@nestjs/common';
import { MaterialesService } from './materiales.service';
import { CreateMaterialDto, BulkMaterialDto } from './dto/create-material.dto';

@Controller('api/materiales')
export class MaterialesController {
  constructor(private readonly materialesService: MaterialesService) {}

  @Get()
  listar(@Query('q') query?: string) {
    return this.materialesService.listar(query);
  }

  @Get(':id/historial')
  obtenerHistorial(@Param('id', ParseIntPipe) id: number) {
    return this.materialesService.obtenerHistorial(id);
  }

  @Post()
  crear(@Body() dto: CreateMaterialDto) {
    return this.materialesService.crear(dto);
  }

  @Post('carga-masiva')
  cargaMasiva(@Body() dto: BulkMaterialDto) {
    return this.materialesService.cargaMasiva(dto);
  }
}
