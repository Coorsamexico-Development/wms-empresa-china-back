import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  Recepcion,
  RecepcionAtributo,
  EvidenciaRecepcion,
  CatalogoAtributo,
  CatalogoTipoEvidencia,
  MaestroMateriales,
  Tarima,
} from '../../entities';
import { CreateRecepcionDto, CreateEvidenciaDto } from './dto/create-recepcion.dto';

@Injectable()
export class InboundService {
  constructor(
    @InjectRepository(Recepcion)
    private readonly recepcionRepo: Repository<Recepcion>,
    @InjectRepository(RecepcionAtributo)
    private readonly recepcionAtributoRepo: Repository<RecepcionAtributo>,
    @InjectRepository(EvidenciaRecepcion)
    private readonly evidenciaRepo: Repository<EvidenciaRecepcion>,
    @InjectRepository(CatalogoAtributo)
    private readonly catalogoAtributoRepo: Repository<CatalogoAtributo>,
    @InjectRepository(CatalogoTipoEvidencia)
    private readonly catalogoEvidenciaRepo: Repository<CatalogoTipoEvidencia>,
    @InjectRepository(MaestroMateriales)
    private readonly materialRepo: Repository<MaestroMateriales>,
    @InjectRepository(Tarima)
    private readonly tarimaRepo: Repository<Tarima>,
  ) {}

  // Consulta de atributos dinámicos activos
  async getAtributosActivos(): Promise<CatalogoAtributo[]> {
    return this.catalogoAtributoRepo.find({
      order: { id: 'ASC' },
    });
  }

  // Búsqueda en Maestro de Materiales
  async buscarMateriales(query?: string): Promise<MaestroMateriales[]> {
    if (!query) {
      return this.materialRepo.find({ take: 20 });
    }
    return this.materialRepo.find({
      where: [
        { sku: Like(`%${query}%`) },
        { descripcion: Like(`%${query}%`) },
      ],
      take: 20,
    });
  }

  // Consulta de Tipos de Evidencia
  async getTiposEvidencia(): Promise<CatalogoTipoEvidencia[]> {
    return this.catalogoEvidenciaRepo.find();
  }

  // Crear Recepción (Inbound)
  async crearRecepcion(dto: CreateRecepcionDto): Promise<Recepcion> {
    const recepcion = this.recepcionRepo.create({
      estado: 'EN_DESCARGA',
      creadoPor: dto.creadoPor,
    });

    const recepcionGuardada = await this.recepcionRepo.save(recepcion);

    if (dto.atributos && dto.atributos.length > 0) {
      const atributosGuardar = dto.atributos.map((attr) =>
        this.recepcionAtributoRepo.create({
          recepcionId: recepcionGuardada.id,
          atributoId: attr.atributoId,
          valor: attr.valor,
          capturadoPor: dto.creadoPor,
        }),
      );
      await this.recepcionAtributoRepo.save(atributosGuardar);
    }

    return this.obtenerRecepcionPorId(recepcionGuardada.id);
  }

  // Cerrar Recepción de Unidad (Verifica que no queden pallets en EN_ARMADO)
  async cerrarRecepcion(id: number): Promise<Recepcion> {
    const rec = await this.recepcionRepo.findOne({ where: { id } });
    if (!rec) {
      throw new NotFoundException(`Recepción #${id} no encontrada`);
    }

    // Buscar pallets activos pendientes de cerrar en esta unidad (excluye eliminados automáticamente por TypeORM)
    const pendientes = await this.tarimaRepo.count({
      where: { recepcionId: id, estado: 'EN_ARMADO' },
    });

    if (pendientes > 0) {
      throw new BadRequestException(
        `No se puede cerrar el recibo de la Unidad #${id}: Quedan ${pendientes} pallet(s) pendientes en estado "EN_ARMADO". Por favor ciérrelos con evidencia fotográfica o elimínelos antes de cerrar la recepción.`,
      );
    }

    rec.estado = 'COMPLETADA';
    await this.recepcionRepo.save(rec);
    return this.obtenerRecepcionPorId(id);
  }

  // Subir / Asociar Evidencia a Recepción
  async agregarEvidencia(recepcionId: number, dto: CreateEvidenciaDto): Promise<EvidenciaRecepcion> {
    const recepcion = await this.recepcionRepo.findOne({ where: { id: recepcionId } });
    if (!recepcion) {
      throw new NotFoundException(`Recepción #${recepcionId} no encontrada`);
    }

    const evidencia = this.evidenciaRepo.create({
      recepcionId,
      tipoEvidenciaId: dto.tipoEvidenciaId,
      urlArchivo: dto.urlArchivo,
      subidoPor: dto.subidoPor,
    });

    return this.evidenciaRepo.save(evidencia);
  }

  // Listar todas las recepciones
  async listarRecepciones(): Promise<Recepcion[]> {
    return this.recepcionRepo.find({
      relations: {
        atributos: { atributo: true },
        evidencias: { tipoEvidencia: true },
        creador: true,
      },
      order: { fechaCreacion: 'DESC' },
    });
  }

  // Obtener detalle por ID
  async obtenerRecepcionPorId(id: number): Promise<Recepcion> {
    const rec = await this.recepcionRepo.findOne({
      where: { id },
      relations: {
        atributos: { atributo: true },
        evidencias: { tipoEvidencia: true },
        creador: true,
        tarimas: {
          detalles: {
            material: true,
          },
        },
      },
    });
    if (!rec) {
      throw new NotFoundException(`Recepción #${id} no encontrada`);
    }
    return rec;
  }
}
