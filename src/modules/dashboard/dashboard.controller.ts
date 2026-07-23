import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  obtenerKpis(@Query('mes') mes?: string, @Query('periodo') periodo?: string) {
    return this.dashboardService.obtenerKpis(mes, periodo);
  }

  @Get('trazabilidad')
  obtenerTrazabilidad() {
    return this.dashboardService.obtenerTrazabilidad();
  }

  @Get('inventario')
  obtenerInventario() {
    return this.dashboardService.obtenerInventario();
  }
}
