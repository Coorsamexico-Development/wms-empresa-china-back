import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  SalidaDespacho,
  SalidaAtributo,
  DetalleSalida,
  EvidenciaSalida,
  Tarima,
} from '../../entities';
import { CreateSalidaDto, DespacharTarimasDto } from './dto/salidas.dto';

@Injectable()
export class SalidasService {
  constructor(
    @InjectRepository(SalidaDespacho)
    private readonly salidaRepo: Repository<SalidaDespacho>,
    @InjectRepository(SalidaAtributo)
    private readonly salidaAtributoRepo: Repository<SalidaAtributo>,
    @InjectRepository(DetalleSalida)
    private readonly detalleSalidaRepo: Repository<DetalleSalida>,
    @InjectRepository(EvidenciaSalida)
    private readonly evidenciaSalidaRepo: Repository<EvidenciaSalida>,
    @InjectRepository(Tarima)
    private readonly tarimaRepo: Repository<Tarima>,
  ) {}

  // Listar todas las órdenes de despacho / salidas
  async listarSalidas(): Promise<SalidaDespacho[]> {
    return this.salidaRepo.find({
      relations: {
        atributos: { atributo: true },
        evidencias: { tipoEvidencia: true },
        creador: true,
        detalles: {
          tarima: { detalles: { material: true } },
        },
      },
      order: { fechaCreacion: 'DESC' },
    });
  }

  // Tarimas disponibles en inventario para despachar
  async obtenerTarimasDisponibles(): Promise<Tarima[]> {
    return this.tarimaRepo.find({
      where: { estado: 'EN_INVENTARIO' },
      relations: { detalles: { material: true }, recepcion: true },
      order: { id: 'ASC' },
    });
  }

  // Crear Orden de Salida de Transporte
  async crearSalida(dto: CreateSalidaDto): Promise<SalidaDespacho> {
    const salida = this.salidaRepo.create({
      estado: 'EN_PROCESO',
      creadoPor: dto.creadoPor,
    });

    const salidaGuardada = await this.salidaRepo.save(salida);

    if (dto.atributos && dto.atributos.length > 0) {
      const atributosGuardar = dto.atributos.map((attr) =>
        this.salidaAtributoRepo.create({
          salidaId: salidaGuardada.id,
          atributoId: attr.atributoId,
          valor: attr.valor,
          capturadoPor: dto.creadoPor,
        }),
      );
      await this.salidaAtributoRepo.save(atributosGuardar);
    }

    return this.obtenerSalidaPorId(salidaGuardada.id);
  }

  // Procesar Selección de Tarimas + Foto Evidencia de Carga + Cierre de Salida
  async procesarDespacho(salidaId: number, dto: DespacharTarimasDto): Promise<SalidaDespacho> {
    const salida = await this.salidaRepo.findOne({ where: { id: salidaId } });
    if (!salida) {
      throw new NotFoundException(`Orden de Salida #${salidaId} no encontrada`);
    }

    if (!dto.tarimaIds || dto.tarimaIds.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos una tarima/pallet para despachar.');
    }

    // 1. Guardar relación en DETALLE_SALIDA y cambiar estado de tarimas a DESPACHADO
    const tarimas = await this.tarimaRepo.findBy({ id: In(dto.tarimaIds) });
    for (const t of tarimas) {
      t.estado = 'DESPACHADO';
      await this.tarimaRepo.save(t);

      const detSalida = this.detalleSalidaRepo.create({
        salidaId,
        tarimaId: t.id,
        registradoPor: dto.despachadoPor,
      });
      await this.detalleSalidaRepo.save(detSalida);
    }

    // 2. Registrar Evidencia Fotográfica de la unidad cargada
    const evidencia = this.evidenciaSalidaRepo.create({
      salidaId,
      tipoEvidenciaId: 2, // Foto Puertas Abiertas / Unidad Cargada
      urlArchivo: dto.urlFotografia,
      subidoPor: dto.despachadoPor,
    });
    await this.evidenciaSalidaRepo.save(evidencia);

    // 3. Cambiar estado de la salida a DESPACHADO
    salida.estado = 'DESPACHADO';
    await this.salidaRepo.save(salida);

    return this.obtenerSalidaPorId(salidaId);
  }

  async obtenerSalidaPorId(id: number): Promise<SalidaDespacho> {
    const s = await this.salidaRepo.findOne({
      where: { id },
      relations: {
        atributos: { atributo: true },
        evidencias: { tipoEvidencia: true },
        creador: true,
        detalles: { tarima: { detalles: { material: true } } },
      },
    });
    if (!s) {
      throw new NotFoundException(`Orden de Salida #${id} no encontrada`);
    }
    return s;
  }
}
