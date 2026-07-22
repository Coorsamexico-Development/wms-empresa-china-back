import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  obtenerKpis() {
    return this.dashboardService.obtenerKpis();
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
