import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recepcion, Tarima, DetalleTarima, SalidaDespacho } from '../../entities';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Recepcion)
    private readonly recepcionRepo: Repository<Recepcion>,
    @InjectRepository(Tarima)
    private readonly tarimaRepo: Repository<Tarima>,
    @InjectRepository(DetalleTarima)
    private readonly detalleRepo: Repository<DetalleTarima>,
    @InjectRepository(SalidaDespacho)
    private readonly salidaRepo: Repository<SalidaDespacho>,
  ) {}

  // Consulta Avanzada de KPIs y Analítica por Día, Semana o Mes
  async obtenerKpis(anioMesParam?: string, periodoParam: string = 'mes') {
    const periodo = ['dia', 'semana', 'mes'].includes(periodoParam?.toLowerCase())
      ? periodoParam.toLowerCase()
      : 'mes';

    const totalRecepciones = await this.recepcionRepo.count();
    const recepcionesEnDescarga = await this.recepcionRepo.count({ where: { estado: 'EN_DESCARGA' } });

    // Stock actual disponible en inventario (Soft delete filtrado)
    const tarimasEnInventario = await this.tarimaRepo.count({ where: { estado: 'EN_INVENTARIO' } });
    const tarimasEnArmado = await this.tarimaRepo.count({ where: { estado: 'EN_ARMADO' } });
    const tarimasDespachadas = await this.tarimaRepo.count({ where: { estado: 'DESPACHADO' } });

    // Sumatoria de Cajas Disponibles en Inventario Actual
    const disponibleResult = await this.detalleRepo
      .createQueryBuilder('detalle')
      .innerJoin('detalle.tarima', 'tarima')
      .select('SUM(detalle.cantidadCajas)', 'total')
      .where('tarima.estado = :estado', { estado: 'EN_INVENTARIO' })
      .andWhere('tarima.eliminado_en IS NULL')
      .andWhere('detalle.eliminado_en IS NULL')
      .getRawOne();
    const cajasEnInventario = disponibleResult?.total ? parseInt(disponibleResult.total, 10) : 0;

    // Entradas Totales Acumuladas
    const entradasResult = await this.detalleRepo
      .createQueryBuilder('detalle')
      .innerJoin('detalle.tarima', 'tarima')
      .select('SUM(detalle.cantidadCajas)', 'total')
      .where('tarima.estado IN (:...estados)', { estados: ['EN_ARMADO', 'EN_INVENTARIO', 'DESPACHADO'] })
      .andWhere('tarima.eliminado_en IS NULL')
      .andWhere('detalle.eliminado_en IS NULL')
      .getRawOne();
    const totalEntradas = entradasResult?.total ? parseInt(entradasResult.total, 10) : 0;

    // Salidas Totales Acumuladas
    const salidasResult = await this.detalleRepo
      .createQueryBuilder('detalle')
      .innerJoin('detalle.tarima', 'tarima')
      .select('SUM(detalle.cantidadCajas)', 'total')
      .where('tarima.estado = :estado', { estado: 'DESPACHADO' })
      .andWhere('tarima.eliminado_en IS NULL')
      .andWhere('detalle.eliminado_en IS NULL')
      .getRawOne();
    const totalSalidas = salidasResult?.total ? parseInt(salidasResult.total, 10) : 0;
    const existencias = totalEntradas - totalSalidas;

    const hoy = new Date();
    const historicoMensual: {
      mesKey: string;
      labelMes: string;
      entradasCajas: number;
      entradasTarimas: number;
      salidasCajas: number;
      salidasTarimas: number;
      ocupacionCajas: number;
    }[] = [];

    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    if (periodo === 'dia') {
      // ÚLTIMOS 14 DÍAS
      for (let i = 13; i >= 0; i--) {
        const d = new Date(hoy.getTime() - i * 24 * 60 * 60 * 1000);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const mStr = m < 10 ? `0${m}` : `${m}`;
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const mesKey = `${y}-${mStr}-${dayStr}`;
        const labelMes = `${day} ${nombresMeses[d.getMonth()]}`;

        const resEntradas = await this.detalleRepo
          .createQueryBuilder('dt')
          .innerJoin('dt.tarima', 't')
          .select('SUM(dt.cantidadCajas)', 'totalCajas')
          .addSelect('COUNT(DISTINCT t.id)', 'totalTarimas')
          .where('DATE_FORMAT(t.fechaCreacion, "%Y-%m-%d") = :mesKey', { mesKey })
          .andWhere('t.eliminado_en IS NULL')
          .andWhere('dt.eliminado_en IS NULL')
          .getRawOne();

        const resSalidas = await this.detalleRepo
          .createQueryBuilder('dt')
          .innerJoin('dt.tarima', 't')
          .select('SUM(dt.cantidadCajas)', 'totalCajas')
          .addSelect('COUNT(DISTINCT t.id)', 'totalTarimas')
          .where('t.estado = :estado AND DATE_FORMAT(t.fechaCreacion, "%Y-%m-%d") = :mesKey', { estado: 'DESPACHADO', mesKey })
          .andWhere('t.eliminado_en IS NULL')
          .andWhere('dt.eliminado_en IS NULL')
          .getRawOne();

        const entCajas = resEntradas?.totalCajas ? parseInt(resEntradas.totalCajas, 10) : 0;
        const entTarimas = resEntradas?.totalTarimas ? parseInt(resEntradas.totalTarimas, 10) : 0;
        const salCajas = resSalidas?.totalCajas ? parseInt(resSalidas.totalCajas, 10) : 0;
        const salTarimas = resSalidas?.totalTarimas ? parseInt(resSalidas.totalTarimas, 10) : 0;

        historicoMensual.push({
          mesKey,
          labelMes,
          entradasCajas: entCajas,
          entradasTarimas: entTarimas,
          salidasCajas: salCajas,
          salidasTarimas: salTarimas,
          ocupacionCajas: Math.max(0, entCajas - salCajas),
        });
      }
    } else if (periodo === 'semana') {
      // ÚLTIMAS 8 SEMANAS
      for (let i = 7; i >= 0; i--) {
        const d = new Date(hoy.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        const weekStr = weekNum < 10 ? `0${weekNum}` : `${weekNum}`;
        const mesKey = `${d.getFullYear()}-${weekStr}`;
        const labelMes = `Sem ${weekNum}`;

        const resEntradas = await this.detalleRepo
          .createQueryBuilder('dt')
          .innerJoin('dt.tarima', 't')
          .select('SUM(dt.cantidadCajas)', 'totalCajas')
          .addSelect('COUNT(DISTINCT t.id)', 'totalTarimas')
          .where('DATE_FORMAT(t.fechaCreacion, "%Y-%u") = :mesKey', { mesKey })
          .andWhere('t.eliminado_en IS NULL')
          .andWhere('dt.eliminado_en IS NULL')
          .getRawOne();

        const resSalidas = await this.detalleRepo
          .createQueryBuilder('dt')
          .innerJoin('dt.tarima', 't')
          .select('SUM(dt.cantidadCajas)', 'totalCajas')
          .addSelect('COUNT(DISTINCT t.id)', 'totalTarimas')
          .where('t.estado = :estado AND DATE_FORMAT(t.fechaCreacion, "%Y-%u") = :mesKey', { estado: 'DESPACHADO', mesKey })
          .andWhere('t.eliminado_en IS NULL')
          .andWhere('dt.eliminado_en IS NULL')
          .getRawOne();

        const entCajas = resEntradas?.totalCajas ? parseInt(resEntradas.totalCajas, 10) : 0;
        const entTarimas = resEntradas?.totalTarimas ? parseInt(resEntradas.totalTarimas, 10) : 0;
        const salCajas = resSalidas?.totalCajas ? parseInt(resSalidas.totalCajas, 10) : 0;
        const salTarimas = resSalidas?.totalTarimas ? parseInt(resSalidas.totalTarimas, 10) : 0;

        historicoMensual.push({
          mesKey,
          labelMes,
          entradasCajas: entCajas,
          entradasTarimas: entTarimas,
          salidasCajas: salCajas,
          salidasTarimas: salTarimas,
          ocupacionCajas: Math.max(0, entCajas - salCajas),
        });
      }
    } else {
      // ÚLTIMOS 6 MESES (MES)
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        const mesKey = `${year}-${monthStr}`;
        const labelMes = `${nombresMeses[d.getMonth()]} ${year}`;

        const resEntradasMes = await this.detalleRepo
          .createQueryBuilder('dt')
          .innerJoin('dt.tarima', 't')
          .select('SUM(dt.cantidadCajas)', 'totalCajas')
          .addSelect('COUNT(DISTINCT t.id)', 'totalTarimas')
          .where('DATE_FORMAT(t.fechaCreacion, "%Y-%m") = :mesKey', { mesKey })
          .andWhere('t.eliminado_en IS NULL')
          .andWhere('dt.eliminado_en IS NULL')
          .getRawOne();

        const resSalidasMes = await this.detalleRepo
          .createQueryBuilder('dt')
          .innerJoin('dt.tarima', 't')
          .select('SUM(dt.cantidadCajas)', 'totalCajas')
          .addSelect('COUNT(DISTINCT t.id)', 'totalTarimas')
          .where('t.estado = :estado AND DATE_FORMAT(t.fechaCreacion, "%Y-%m") = :mesKey', { estado: 'DESPACHADO', mesKey })
          .andWhere('t.eliminado_en IS NULL')
          .andWhere('dt.eliminado_en IS NULL')
          .getRawOne();

        const entCajas = resEntradasMes?.totalCajas ? parseInt(resEntradasMes.totalCajas, 10) : 0;
        const entTarimas = resEntradasMes?.totalTarimas ? parseInt(resEntradasMes.totalTarimas, 10) : 0;
        const salCajas = resSalidasMes?.totalCajas ? parseInt(resSalidasMes.totalCajas, 10) : 0;
        const salTarimas = resSalidasMes?.totalTarimas ? parseInt(resSalidasMes.totalTarimas, 10) : 0;

        historicoMensual.push({
          mesKey,
          labelMes,
          entradasCajas: entCajas,
          entradasTarimas: entTarimas,
          salidasCajas: salCajas,
          salidasTarimas: salTarimas,
          ocupacionCajas: Math.max(0, entCajas - salCajas),
        });
      }
    }

    return {
      totalRecepciones,
      recepcionesEnDescarga,
      tarimasEnInventario,
      tarimasEnArmado,
      tarimasDespachadas,
      cajasEnInventario,
      totalEntradas,
      totalSalidas,
      existencias,
      historicoMensual,
    };
  }

  // Bitácora Cronológica de Eventos y Auditoría WMS
  async obtenerTrazabilidad() {
    const eventos: any[] = [];

    // 1. Eventos de Recepciones de Transporte (Llegadas)
    const recepciones = await this.recepcionRepo.find({
      relations: {
        atributos: { atributo: true },
        evidencias: { tipoEvidencia: true },
        creador: true,
      },
      order: { fechaCreacion: 'DESC' },
    });

    for (const r of recepciones) {
      eventos.push({
        id: `REC-${r.id}`,
        fecha: r.fechaCreacion,
        categoria: 'ENTRADA',
        tipoEvento: `Recepción de Unidad (${r.estado})`,
        descripcion: `Llegada de transporte de recepción #${r.id}`,
        detalles: r.atributos?.map((a) => `${a.atributo?.nombre}: ${a.valor}`).join(' • ') || 'Sin datos adicionales',
        usuario: r.creador?.nombreCompleto || 'Juan Pérez (Operador)',
        fotos: r.evidencias?.map((e) => e.urlArchivo) || [],
      });
    }

    // 2. Eventos de Paletizado (Creación / Cierre de Tarimas LPN, excluye eliminados)
    const tarimas = await this.tarimaRepo.find({
      relations: {
        detalles: { material: true },
        evidencias: { tipoEvidencia: true },
        armador: true,
        recepcion: true,
      },
      order: { fechaCreacion: 'DESC' },
    });

    for (const t of tarimas) {
      const totalCajas = t.detalles?.reduce((acc, d) => acc + d.cantidadCajas, 0) || 0;
      const skus = t.detalles?.map((d) => `[${d.material?.sku}] ${d.cantidadCajas}cjas`).join(', ') || 'Sin productos';

      eventos.push({
        id: `PAL-${t.id}`,
        fecha: t.fechaCreacion,
        categoria: 'PALETIZADO',
        tipoEvento: `Pallet LPN ${t.lpnCodigo} (${t.estado})`,
        descripcion: `Armado y estibado de pallet LPN ${t.lpnCodigo} en Unidad #${t.recepcionId}`,
        detalles: `Total ${totalCajas} cajas estibadas. Contenido: ${skus}`,
        usuario: t.armador?.nombreCompleto || 'Juan Pérez (Operador)',
        fotos: t.evidencias?.map((e) => e.urlArchivo) || [],
      });
    }

    // 3. Eventos de Salidas y Despacho de Transporte
    const salidas = await this.salidaRepo.find({
      relations: {
        atributos: { atributo: true },
        evidencias: { tipoEvidencia: true },
        creador: true,
        detalles: { tarima: true },
      },
      order: { fechaCreacion: 'DESC' },
    });

    for (const s of salidas) {
      const palletsDespachados = s.detalles?.map((d) => d.tarima?.lpnCodigo).join(', ') || 'Sin pallets';

      eventos.push({
        id: `SAL-${s.id}`,
        fecha: s.fechaCreacion,
        categoria: 'SALIDA',
        tipoEvento: `Despacho de Salida #${s.id}`,
        descripcion: `Embarque y salida de transporte #${s.id}`,
        detalles: `Pallets embarcados: ${palletsDespachados}. ${s.atributos?.map((a) => `${a.atributo?.nombre}: ${a.valor}`).join(' • ')}`,
        usuario: s.creador?.nombreCompleto || 'Juan Pérez (Operador)',
        fotos: s.evidencias?.map((e) => e.urlArchivo) || [],
      });
    }

    // Ordenar cronológicamente por fecha descendente (lo más reciente primero)
    return eventos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  // Control de Inventario por LPN
  async obtenerInventario() {
    return this.tarimaRepo.find({
      where: { estado: 'EN_INVENTARIO' },
      relations: {
        detalles: { material: true },
        recepcion: true,
        armador: true,
      },
      order: { id: 'DESC' },
    });
  }
}
