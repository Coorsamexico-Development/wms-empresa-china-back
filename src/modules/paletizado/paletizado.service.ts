import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Tarima,
  DetalleTarima,
  EvidenciaTarima,
  Recepcion,
  MaestroMateriales,
} from '../../entities';
import { CreateTarimaDto, AddDetalleTarimaDto, CierreTarimaDto } from './dto/paletizado.dto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bwipjs = require('bwip-js');

@Injectable()
export class PaletizadoService {
  constructor(
    @InjectRepository(Tarima)
    private readonly tarimaRepo: Repository<Tarima>,
    @InjectRepository(DetalleTarima)
    private readonly detalleRepo: Repository<DetalleTarima>,
    @InjectRepository(EvidenciaTarima)
    private readonly evidenciaRepo: Repository<EvidenciaTarima>,
    @InjectRepository(Recepcion)
    private readonly recepcionRepo: Repository<Recepcion>,
    @InjectRepository(MaestroMateriales)
    private readonly materialRepo: Repository<MaestroMateriales>,
  ) {}

  // Crear o abrir nueva tarima en armado para una recepción
  async crearTarima(dto: CreateTarimaDto): Promise<Tarima> {
    const recepcion = await this.recepcionRepo.findOne({ where: { id: dto.recepcionId } });
    if (!recepcion) {
      throw new NotFoundException(`Recepción #${dto.recepcionId} no encontrada`);
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const lpnCodigo = `LPN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;

    const tarima = this.tarimaRepo.create({
      recepcionId: dto.recepcionId,
      lpnCodigo,
      estado: 'EN_ARMADO',
      armadoPor: dto.armadoPor,
    });

    const tarimaGuardada = await this.tarimaRepo.save(tarima);
    return this.obtenerTarimaPorId(tarimaGuardada.id);
  }

  // Soft Delete de Tarima / Pallet
  async eliminarTarima(id: number): Promise<void> {
    const tarima = await this.tarimaRepo.findOne({ where: { id } });
    if (!tarima) {
      throw new NotFoundException(`Tarima #${id} no encontrada`);
    }
    // Soft delete de detalles y de la tarima
    await this.detalleRepo.softDelete({ tarimaId: id });
    await this.tarimaRepo.softDelete(id);
  }

  // Agregar item/SKU a la tarima
  async agregarDetalle(tarimaId: number, dto: AddDetalleTarimaDto): Promise<DetalleTarima> {
    const tarima = await this.tarimaRepo.findOne({ where: { id: tarimaId } });
    if (!tarima) {
      throw new NotFoundException(`Tarima #${tarimaId} no encontrada`);
    }
    if (tarima.estado !== 'EN_ARMADO') {
      throw new BadRequestException(`La tarima ${tarima.lpnCodigo} ya está cerrada.`);
    }

    const material = await this.materialRepo.findOne({ where: { id: dto.materialId } });
    if (!material) {
      throw new NotFoundException(`Material #${dto.materialId} no encontrado`);
    }

    const detalle = this.detalleRepo.create({
      tarimaId,
      materialId: dto.materialId,
      cantidadCajas: dto.cantidadCajas,
      registradoPor: dto.registradoPor,
    });

    return this.detalleRepo.save(detalle);
  }

  // Eliminar un detalle de la tarima (Soft Delete)
  async eliminarDetalle(detalleId: number): Promise<void> {
    await this.detalleRepo.softDelete(detalleId);
  }

  // Cierre fotográfico de Tarima
  async cerrarTarima(tarimaId: number, dto: CierreTarimaDto): Promise<Tarima> {
    const tarima = await this.tarimaRepo.findOne({
      where: { id: tarimaId },
      relations: { detalles: true },
    });
    if (!tarima) {
      throw new NotFoundException(`Tarima #${tarimaId} no encontrada`);
    }
    if (!tarima.detalles || tarima.detalles.length === 0) {
      throw new BadRequestException('No se puede cerrar una tarima sin productos agregados.');
    }

    // Registrar evidencia fotográfica
    const evidencia = this.evidenciaRepo.create({
      tarimaId,
      tipoEvidenciaId: 3, // Foto Tarima Armada
      urlArchivo: dto.urlFotografia,
      subidoPor: dto.cerradoPor,
    });
    await this.evidenciaRepo.save(evidencia);

    // Cambiar estado a EN_INVENTARIO
    tarima.estado = 'EN_INVENTARIO';
    await this.tarimaRepo.save(tarima);

    return this.obtenerTarimaPorId(tarimaId);
  }

  // Obtener tarima por ID (filtra automáticamente eliminados)
  async obtenerTarimaPorId(id: number): Promise<Tarima> {
    const tarima = await this.tarimaRepo.findOne({
      where: { id },
      relations: {
        detalles: { material: true },
        evidencias: { tipoEvidencia: true },
        armador: true,
        recepcion: true,
      },
    });
    if (!tarima) {
      throw new NotFoundException(`Tarima #${id} no encontrada`);
    }
    return tarima;
  }

  // Listar tarimas activas (excluye eliminadas por Soft Delete)
  async listarTarimasPorRecepcion(recepcionId: number): Promise<Tarima[]> {
    return this.tarimaRepo.find({
      where: { recepcionId },
      relations: { detalles: { material: true }, evidencias: true },
      order: { id: 'DESC' },
    });
  }

  // Generación de ZPL con 2 Códigos de Barras (ID de Tarima + Código LPN)
  async generarZPL(tarimaId: number): Promise<{ lpn: string; zpl: string }> {
    const tarima = await this.obtenerTarimaPorId(tarimaId);
    const totalCajas = tarima.detalles.reduce((acc, item) => acc + item.cantidadCajas, 0);

    const zpl = `
^XA
^FO50,20^A0N,30,30^FDCOORSA LOGISTICS - ETIQUETA PALLET LPN^FS
^FO50,55^GB700,2,2^FS

^FO50,70^A0N,22,22^FDCODIGO 1: ID DE TARIMA (#${tarima.id})^FS
^FO50,95^BY2,2,70^BCN,70,Y,N,N^FDTAR-${tarima.id}^FS

^FO50,205^GB700,2,2^FS
^FO50,220^A0N,22,22^FDCODIGO 2: CODIGO LPN (${tarima.lpnCodigo})^FS
^FO50,245^BY2,2,70^BCN,70,Y,N,N^FD${tarima.lpnCodigo}^FS

^FO50,355^GB700,2,2^FS
^FO50,370^A0N,20,20^FDRECEPCION #: ${tarima.recepcionId}  |  ESTADO: ${tarima.estado}^FS
^FO50,395^A0N,20,20^FDTOTAL CAJAS ESTIBADAS: ${totalCajas} CAJAS^FS
^FO50,420^A0N,18,18^FDFECHA: ${new Date(tarima.fechaCreacion).toLocaleString()}^FS
^XZ
`.trim();

    return { lpn: tarima.lpnCodigo, zpl };
  }

  // Generación de Etiqueta PDF con 2 Códigos de Barras (ID de Tarima + Código LPN)
  async generarPDFBuffer(tarimaId: number): Promise<Buffer> {
    const tarima = await this.obtenerTarimaPorId(tarimaId);
    const totalCajas = tarima.detalles.reduce((acc, item) => acc + item.cantidadCajas, 0);

    // Generar imagen PNG del Código de Barras 1: ID de Tarima
    const pngIdBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: `TAR-${tarima.id}`,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: 'center',
    });

    // Generar imagen PNG del Código de Barras 2: Código LPN
    const pngLpnBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: tarima.lpnCodigo,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: 'center',
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: [420, 620], margin: 20 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      // Encabezado
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0284c7').text('COORSA LOGISTICS WMS', { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor('#334155').text('Etiqueta Oficial de Armado de Tarima', { align: 'center' });
      doc.moveDown(0.4);
      doc.lineWidth(1.5).strokeColor('#0284c7').moveTo(20, doc.y).lineTo(400, doc.y).stroke();
      doc.moveDown(0.6);

      // CÓDIGO DE BARRAS 1: ID DE TARIMA
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(`1. CÓDIGO DE BARRAS - ID DE TARIMA (#${tarima.id}):`, { align: 'left' });
      doc.moveDown(0.2);
      doc.image(pngIdBuffer, 60, doc.y, { fit: [300, 70], align: 'center' });
      doc.moveDown(4.5);

      // CÓDIGO DE BARRAS 2: CÓDIGO LPN
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(`2. CÓDIGO DE BARRAS - CÓDIGO LPN (${tarima.lpnCodigo}):`, { align: 'left' });
      doc.moveDown(0.2);
      doc.image(pngLpnBuffer, 60, doc.y, { fit: [300, 70], align: 'center' });
      doc.moveDown(4.5);

      // Línea divisoria
      doc.lineWidth(1).strokeColor('#cbd5e1').moveTo(20, doc.y).lineTo(400, doc.y).stroke();
      doc.moveDown(0.5);

      // Datos de Control
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Resumen de Contenido y Almacenamiento:');
      doc.fontSize(9).font('Helvetica').fillColor('#334155')
        .text(`• Recepción #: ${tarima.recepcionId}`)
        .text(`• Estado: ${tarima.estado}`)
        .text(`• Fecha de Armado: ${new Date(tarima.fechaCreacion).toLocaleString()}`)
        .text(`• Total de Cajas Estibadas: ${totalCajas} cajas`);

      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text('Detalle de SKUs Estibados:');

      // Tabla de Contenidos SKUs
      tarima.detalles.forEach((det, index) => {
        doc.fontSize(8.5).font('Helvetica').fillColor('#475569')
          .text(`${index + 1}. [${det.material?.sku}] ${det.material?.descripcion} - ${det.cantidadCajas} cjas`);
      });

      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text('Impreso desde COORSA WMS Logistics System', { align: 'center' });

      doc.end();
    });
  }
}
