import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaestroMateriales, DetalleTarima } from '../../entities';
import { CreateMaterialDto, BulkMaterialDto } from './dto/create-material.dto';

@Injectable()
export class MaterialesService {
  constructor(
    @InjectRepository(MaestroMateriales)
    private readonly materialRepo: Repository<MaestroMateriales>,
    @InjectRepository(DetalleTarima)
    private readonly detalleRepo: Repository<DetalleTarima>,
  ) {}

  async listar(query?: string): Promise<any[]> {
    const qb = this.materialRepo
      .createQueryBuilder('m')
      .select([
        'm.id AS id',
        'm.sku AS sku',
        'm.descripcion AS descripcion',
        'm.cliente AS cliente',
        'm.fechaCreacion AS fechaCreacion',
      ])
      .addSelect(
        `(SELECT COALESCE(SUM(dt.cantidad_cajas), 0) 
          FROM DETALLE_TARIMA dt 
          INNER JOIN TARIMA t ON t.id = dt.tarima_id 
          WHERE dt.material_id = m.id AND t.estado IN ('EN_ARMADO', 'EN_INVENTARIO', 'DESPACHADO') AND t.eliminado_en IS NULL AND dt.eliminado_en IS NULL)`,
        'entradas',
      )
      .addSelect(
        `(SELECT COALESCE(SUM(dt.cantidad_cajas), 0) 
          FROM DETALLE_TARIMA dt 
          INNER JOIN TARIMA t ON t.id = dt.tarima_id 
          WHERE dt.material_id = m.id AND t.estado = 'DESPACHADO' AND t.eliminado_en IS NULL AND dt.eliminado_en IS NULL)`,
        'salidas',
      )
      .addSelect(
        `(SELECT COALESCE(SUM(dt.cantidad_cajas), 0) 
          FROM DETALLE_TARIMA dt 
          INNER JOIN TARIMA t ON t.id = dt.tarima_id 
          WHERE dt.material_id = m.id AND t.estado = 'EN_INVENTARIO' AND t.eliminado_en IS NULL AND dt.eliminado_en IS NULL)`,
        'disponible',
      );

    if (query) {
      qb.where('m.sku LIKE :query OR m.descripcion LIKE :query', { query: `%${query}%` });
    }

    qb.orderBy('m.id', 'DESC');
    const rawResults = await qb.getRawMany();

    return rawResults.map((r) => ({
      id: r.id,
      sku: r.sku,
      descripcion: r.descripcion,
      cliente: r.cliente,
      fechaCreacion: r.fechaCreacion,
      entradas: parseInt(r.entradas || '0', 10),
      salidas: parseInt(r.salidas || '0', 10),
      disponible: parseInt(r.disponible || '0', 10),
    }));
  }

  // Consulta de Historial completo por SKU incluyendo evidencias fotográficas de ingresos y salidas
  async obtenerHistorial(materialId: number) {
    const material = await this.materialRepo.findOne({ where: { id: materialId } });
    if (!material) {
      throw new NotFoundException(`Material #${materialId} no encontrado`);
    }

    // 1. Historial de Entradas (Tarimas creadas/armadas/recibidas con evidencias, excluye eliminados)
    const entradasDetalles = await this.detalleRepo
      .createQueryBuilder('dt')
      .innerJoinAndSelect('dt.tarima', 't')
      .leftJoinAndSelect('t.evidencias', 'et')
      .leftJoinAndSelect('t.recepcion', 'r')
      .leftJoinAndSelect('r.evidencias', 'er')
      .leftJoinAndSelect('r.atributos', 'ra')
      .leftJoinAndSelect('ra.atributo', 'a')
      .where('dt.material_id = :materialId', { materialId })
      .andWhere('t.eliminado_en IS NULL')
      .andWhere('dt.eliminado_en IS NULL')
      .orderBy('t.id', 'DESC')
      .getMany();

    const entradas = entradasDetalles.map((dt) => {
      const fotosTarima = dt.tarima?.evidencias?.map((e) => e.urlArchivo) || [];
      const fotosRecepcion = dt.tarima?.recepcion?.evidencias?.map((e) => e.urlArchivo) || [];
      const fotos = [...fotosTarima, ...fotosRecepcion];

      return {
        tarimaId: dt.tarima.id,
        recepcionId: dt.tarima.recepcionId,
        lpnCodigo: dt.tarima.lpnCodigo,
        cantidadCajas: dt.cantidadCajas,
        estadoTarima: dt.tarima.estado,
        fechaCreacion: dt.tarima.fechaCreacion,
        atributosUnidad: dt.tarima.recepcion?.atributos?.map((a) => `${a.atributo?.nombre}: ${a.valor}`).join(' • ') || 'N/A',
        fotos,
      };
    });

    // 2. Historial de Salidas (Tarimas despachadas con evidencias de salida, excluye eliminados)
    const salidasDetalles = await this.detalleRepo
      .createQueryBuilder('dt')
      .innerJoinAndSelect('dt.tarima', 't')
      .innerJoin('DETALLE_SALIDA', 'ds', 'ds.tarima_id = t.id')
      .innerJoinAndSelect('ds.salida', 's')
      .leftJoinAndSelect('s.evidencias', 'es')
      .where('dt.material_id = :materialId AND t.estado = :estado', { materialId, estado: 'DESPACHADO' })
      .andWhere('t.eliminado_en IS NULL')
      .andWhere('dt.eliminado_en IS NULL')
      .orderBy('t.id', 'DESC')
      .getMany();

    const salidas = salidasDetalles.map((dt) => {
      const fotosSalida = (dt.tarima as any)?.detallesSalida?.[0]?.salida?.evidencias?.map((e: any) => e.urlArchivo) || [];
      const fotosTarima = dt.tarima?.evidencias?.map((e) => e.urlArchivo) || [];
      const fotos = [...fotosSalida, ...fotosTarima];

      return {
        tarimaId: dt.tarima.id,
        recepcionId: dt.tarima.recepcionId,
        lpnCodigo: dt.tarima.lpnCodigo,
        cantidadCajas: dt.cantidadCajas,
        fechaCreacion: dt.tarima.fechaCreacion,
        fotos,
      };
    });

    // 3. Stock Disponible Actual (excluye eliminados)
    const disponiblesDetalles = await this.detalleRepo
      .createQueryBuilder('dt')
      .innerJoinAndSelect('dt.tarima', 't')
      .leftJoinAndSelect('t.evidencias', 'et')
      .where('dt.material_id = :materialId AND t.estado = :estado', { materialId, estado: 'EN_INVENTARIO' })
      .andWhere('t.eliminado_en IS NULL')
      .andWhere('dt.eliminado_en IS NULL')
      .orderBy('t.id', 'DESC')
      .getMany();

    const disponible = disponiblesDetalles.map((dt) => ({
      tarimaId: dt.tarima.id,
      recepcionId: dt.tarima.recepcionId,
      lpnCodigo: dt.tarima.lpnCodigo,
      cantidadCajas: dt.cantidadCajas,
      estado: dt.tarima.estado,
      fotos: dt.tarima?.evidencias?.map((e) => e.urlArchivo) || [],
    }));

    return {
      material,
      entradas,
      salidas,
      disponible,
    };
  }

  async crear(dto: CreateMaterialDto): Promise<MaestroMateriales> {
    const existe = await this.materialRepo.findOne({ where: { sku: dto.sku } });
    if (existe) {
      throw new ConflictException(`El SKU ${dto.sku} ya existe en el Maestro de Materiales.`);
    }
    const nuevo = this.materialRepo.create({
      ...dto,
      cliente: dto.cliente || 'COORSA',
    });
    return this.materialRepo.save(nuevo);
  }

  async cargaMasiva(dto: BulkMaterialDto): Promise<{ insertados: number; existentes: number }> {
    let insertados = 0;
    let existentes = 0;

    for (const item of dto.materiales) {
      const existe = await this.materialRepo.findOne({ where: { sku: item.sku } });
      if (!existe) {
        const nuevo = this.materialRepo.create({
          sku: item.sku,
          descripcion: item.descripcion,
          cliente: item.cliente || 'COORSA',
        });
        await this.materialRepo.save(nuevo);
        insertados++;
      } else {
        existentes++;
      }
    }

    return { insertados, existentes };
  }
}
