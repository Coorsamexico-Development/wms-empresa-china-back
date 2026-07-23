import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Rol,
  Usuario,
  CatalogoAtributo,
  CatalogoTipoEvidencia,
  MaestroMateriales,
  Recepcion,
  RecepcionAtributo,
  EvidenciaRecepcion,
  Tarima,
  DetalleTarima,
  EvidenciaTarima,
  SalidaDespacho,
  SalidaAtributo,
  DetalleSalida,
} from '../entities';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Rol) private readonly rolRepo: Repository<Rol>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(CatalogoAtributo) private readonly atributoRepo: Repository<CatalogoAtributo>,
    @InjectRepository(CatalogoTipoEvidencia) private readonly evidenciaRepo: Repository<CatalogoTipoEvidencia>,
    @InjectRepository(MaestroMateriales) private readonly materialRepo: Repository<MaestroMateriales>,
    @InjectRepository(Recepcion) private readonly recepcionRepo: Repository<Recepcion>,
    @InjectRepository(RecepcionAtributo) private readonly recAttrRepo: Repository<RecepcionAtributo>,
    @InjectRepository(EvidenciaRecepcion) private readonly recEvidRepo: Repository<EvidenciaRecepcion>,
    @InjectRepository(Tarima) private readonly tarimaRepo: Repository<Tarima>,
    @InjectRepository(DetalleTarima) private readonly detalleTarimaRepo: Repository<DetalleTarima>,
    @InjectRepository(EvidenciaTarima) private readonly evidTarimaRepo: Repository<EvidenciaTarima>,
    @InjectRepository(SalidaDespacho) private readonly salidaRepo: Repository<SalidaDespacho>,
    @InjectRepository(SalidaAtributo) private readonly salidaAttrRepo: Repository<SalidaAtributo>,
    @InjectRepository(DetalleSalida) private readonly detalleSalidaRepo: Repository<DetalleSalida>,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Verificando y ejecutando semillas de base de datos...');

      // 1. Roles y Permisos Básicos Estándar WMS
      const rolesPredefinidos = [
        {
          nombre: 'Administrador de Almacén',
          descripcion: 'Acceso total al sistema, analítica, usuarios, catálogos, auditoría y operaciones.',
          permisos: 'RECEPTIONS_READ,RECEPTIONS_WRITE,PALLETIZING_WRITE,DISPATCH_WRITE,AUDIT_VIEW,ADMIN_ALL',
        },
        {
          nombre: 'Operador de Recepción & Inbound',
          descripcion: 'Registro de transportes de llegada, captura de sellos, placas y fotografías de entrada.',
          permisos: 'RECEPTIONS_READ,RECEPTIONS_WRITE,PALLETIZING_WRITE',
        },
        {
          nombre: 'Operador de Paletizado (Estibador)',
          descripcion: 'Armado de pallets LPN a granel, selección de SKUs y generación de etiquetas PDF/ZPL.',
          permisos: 'RECEPTIONS_READ,PALLETIZING_WRITE',
        },
        {
          nombre: 'Operador de Salidas & Outbound',
          descripcion: 'Selección de pallets en inventario, carga en transportes de salida y fotos de embarque.',
          permisos: 'DISPATCH_WRITE,RECEPTIONS_READ',
        },
        {
          nombre: 'Auditor de Calidad & Trazabilidad',
          descripcion: 'Consulta de la bitácora cronológica de eventos, inspección de fotos de evidencia y reportes.',
          permisos: 'AUDIT_VIEW,RECEPTIONS_READ',
        },
      ];

      for (const rData of rolesPredefinidos) {
        const existe = await this.rolRepo.findOne({ where: { nombre: rData.nombre } });
        if (!existe) {
          await this.rolRepo.save(this.rolRepo.create(rData));
        } else {
          existe.descripcion = rData.descripcion;
          existe.permisos = rData.permisos;
          await this.rolRepo.save(existe);
        }
      }
      this.logger.log('Roles y Permisos iniciales sincronizados.');

      const adminRol = await this.rolRepo.findOne({ where: { nombre: 'Administrador de Almacén' } });
      const operadorRol = await this.rolRepo.findOne({ where: { nombre: 'Operador de Recepción & Inbound' } });

      // 2. Usuarios demo
      let adminUser = await this.usuarioRepo.findOne({ where: { email: 'admin@coorsa.com' } });
      if (!adminUser && adminRol) {
        adminUser = await this.usuarioRepo.save(
          this.usuarioRepo.create({
            nombreCompleto: 'Administrador General WMS',
            email: 'admin@coorsa.com',
            passwordHash: 'Coorsa#2026!',
            rolId: adminRol.id,
            activo: true,
          }),
        );
        this.logger.log('Usuario admin creado.');
      }

      let opUser = await this.usuarioRepo.findOne({ where: { email: 'juan.perez@coorsa.com' } });
      if (!opUser && operadorRol) {
        opUser = await this.usuarioRepo.save(
          this.usuarioRepo.create({
            nombreCompleto: 'Juan Pérez (Operador Inbound)',
            email: 'juan.perez@coorsa.com',
            passwordHash: 'Coorsa#2026!',
            rolId: operadorRol.id,
            activo: true,
          }),
        );
      }

      const defaultUser = adminUser || opUser;
      if (!defaultUser) return;

      // 3. Catálogo Atributos de Llegada
      let atributos = await this.atributoRepo.find();
      if (atributos.length === 0) {
        atributos = await this.atributoRepo.save([
          { nombre: 'Nombre de Operador', tipoDato: 'texto', requerido: true },
          { nombre: 'Placas de Unidad', tipoDato: 'texto', requerido: true },
          { nombre: 'Línea de Transporte', tipoDato: 'texto', requerido: true },
          { nombre: 'Número de Sello', tipoDato: 'texto', requerido: true },
        ]);
        this.logger.log('Atributos de Llegada creados.');
      }

      // 4. Catálogo Tipo Evidencia
      let evidencias = await this.evidenciaRepo.find();
      if (evidencias.length === 0) {
        evidencias = await this.evidenciaRepo.save([
          { nombre: 'Fotografía Fachada Exterior' },
          { nombre: 'Fotografía Puertas Abiertas' },
          { nombre: 'Fotografía Tarima Armada' },
          { nombre: 'PDF Remisión de Embarque' },
        ]);
        this.logger.log('Tipos de Evidencia creados.');
      }

      // 5. Maestro de Materiales Demo
      let materiales = await this.materialRepo.find();
      if (materiales.length === 0) {
        materiales = await this.materialRepo.save([
          { sku: 'SKU-ELEC-001', descripcion: 'Televisor Smart TV 55" 4K UHD', cliente: 'COORSA' },
          { sku: 'SKU-ELEC-002', descripcion: 'Equipo de Minicomponente Hi-Fi 300W', cliente: 'COORSA' },
          { sku: 'SKU-ELEC-003', descripcion: 'Consola de Videojuegos 1TB SSD', cliente: 'COORSA' },
          { sku: 'SKU-ELEC-004', descripcion: 'Monitor Gamer 27" Curved 165Hz', cliente: 'COORSA' },
          { sku: 'SKU-ELEC-005', descripcion: 'Laptop Pro 15" Intel i7 16GB RAM 512GB SSD', cliente: 'COORSA' },
          { sku: 'SKU-ELEC-006', descripcion: 'Smartphone Flagship 6.7" OLED 256GB', cliente: 'COORSA' },
        ]);
        this.logger.log('Maestro de Materiales demo poblado.');
      }

      // 6. Poblar datos operacionales de prueba (Recepciones, Tarimas, Salidas)
      const countRecepciones = await this.recepcionRepo.count();
      if (countRecepciones === 0) {
        this.logger.log('Generando datos relacionales completos de prueba en producción...');

        const attrOperador = atributos.find((a) => a.nombre.includes('Operador')) || atributos[0];
        const attrPlacas = atributos.find((a) => a.nombre.includes('Placas')) || atributos[1];
        const attrLinea = atributos.find((a) => a.nombre.includes('Línea')) || atributos[2];
        const attrSello = atributos.find((a) => a.nombre.includes('Sello')) || atributos[3];

        // --- RECEPCIÓN 1 (COMPLETADA) ---
        const rec1 = await this.recepcionRepo.save(
          this.recepcionRepo.create({
            estado: 'COMPLETADA',
            creadoPor: defaultUser.id,
          }),
        );

        await this.recAttrRepo.save([
          { recepcionId: rec1.id, atributoId: attrOperador.id, valor: 'Carlos Mendoza', capturadoPor: defaultUser.id },
          { recepcionId: rec1.id, atributoId: attrPlacas.id, valor: '88-ABC-1', capturadoPor: defaultUser.id },
          { recepcionId: rec1.id, atributoId: attrLinea.id, valor: 'Transportes Coorsa Express', capturadoPor: defaultUser.id },
          { recepcionId: rec1.id, atributoId: attrSello.id, valor: 'SL-9910', capturadoPor: defaultUser.id },
        ]);

        // Tarimas para Rec 1
        const t1_1 = await this.tarimaRepo.save(
          this.tarimaRepo.create({
            recepcionId: rec1.id,
            lpnCodigo: 'LPN-20260720-001',
            estado: 'DESPACHADA',
            armadoPor: defaultUser.id,
          }),
        );
        await this.detalleTarimaRepo.save([
          { tarimaId: t1_1.id, materialId: materiales[0].id, cantidadCajas: 40, registradoPor: defaultUser.id },
          { tarimaId: t1_1.id, materialId: materiales[1].id, cantidadCajas: 20, registradoPor: defaultUser.id },
        ]);

        const t1_2 = await this.tarimaRepo.save(
          this.tarimaRepo.create({
            recepcionId: rec1.id,
            lpnCodigo: 'LPN-20260720-002',
            estado: 'EN_INVENTARIO',
            armadoPor: defaultUser.id,
          }),
        );
        await this.detalleTarimaRepo.save([
          { tarimaId: t1_2.id, materialId: materiales[2].id, cantidadCajas: 50, registradoPor: defaultUser.id },
        ]);

        const t1_3 = await this.tarimaRepo.save(
          this.tarimaRepo.create({
            recepcionId: rec1.id,
            lpnCodigo: 'LPN-20260720-003',
            estado: 'EN_INVENTARIO',
            armadoPor: defaultUser.id,
          }),
        );
        await this.detalleTarimaRepo.save([
          { tarimaId: t1_3.id, materialId: materiales[3].id, cantidadCajas: 35, registradoPor: defaultUser.id },
          { tarimaId: t1_3.id, materialId: materiales[4].id, cantidadCajas: 15, registradoPor: defaultUser.id },
        ]);

        // --- RECEPCIÓN 2 (COMPLETADA) ---
        const rec2 = await this.recepcionRepo.save(
          this.recepcionRepo.create({
            estado: 'COMPLETADA',
            creadoPor: defaultUser.id,
          }),
        );

        await this.recAttrRepo.save([
          { recepcionId: rec2.id, atributoId: attrOperador.id, valor: 'Roberto Gómez', capturadoPor: defaultUser.id },
          { recepcionId: rec2.id, atributoId: attrPlacas.id, valor: '55-DEF-9', capturadoPor: defaultUser.id },
          { recepcionId: rec2.id, atributoId: attrLinea.id, valor: 'Fletera Nacional SA', capturadoPor: defaultUser.id },
          { recepcionId: rec2.id, atributoId: attrSello.id, valor: 'SL-7721', capturadoPor: defaultUser.id },
        ]);

        const t2_1 = await this.tarimaRepo.save(
          this.tarimaRepo.create({
            recepcionId: rec2.id,
            lpnCodigo: 'LPN-20260721-001',
            estado: 'EN_INVENTARIO',
            armadoPor: defaultUser.id,
          }),
        );
        await this.detalleTarimaRepo.save([
          { tarimaId: t2_1.id, materialId: materiales[4].id, cantidadCajas: 30, registradoPor: defaultUser.id },
          { tarimaId: t2_1.id, materialId: materiales[5].id, cantidadCajas: 40, registradoPor: defaultUser.id },
        ]);

        const t2_2 = await this.tarimaRepo.save(
          this.tarimaRepo.create({
            recepcionId: rec2.id,
            lpnCodigo: 'LPN-20260721-002',
            estado: 'EN_INVENTARIO',
            armadoPor: defaultUser.id,
          }),
        );
        await this.detalleTarimaRepo.save([
          { tarimaId: t2_2.id, materialId: materiales[0].id, cantidadCajas: 25, registradoPor: defaultUser.id },
        ]);

        // --- RECEPCIÓN 3 (EN DESCARGA) ---
        const rec3 = await this.recepcionRepo.save(
          this.recepcionRepo.create({
            estado: 'EN_DESCARGA',
            creadoPor: defaultUser.id,
          }),
        );

        await this.recAttrRepo.save([
          { recepcionId: rec3.id, atributoId: attrOperador.id, valor: 'Alejandro Torres', capturadoPor: defaultUser.id },
          { recepcionId: rec3.id, atributoId: attrPlacas.id, valor: '33-GHI-4', capturadoPor: defaultUser.id },
          { recepcionId: rec3.id, atributoId: attrLinea.id, valor: 'Logística Express MX', capturadoPor: defaultUser.id },
          { recepcionId: rec3.id, atributoId: attrSello.id, valor: 'SL-4432', capturadoPor: defaultUser.id },
        ]);

        const t3_1 = await this.tarimaRepo.save(
          this.tarimaRepo.create({
            recepcionId: rec3.id,
            lpnCodigo: 'LPN-20260723-001',
            estado: 'EN_ARMADO',
            armadoPor: defaultUser.id,
          }),
        );
        await this.detalleTarimaRepo.save([
          { tarimaId: t3_1.id, materialId: materiales[1].id, cantidadCajas: 15, registradoPor: defaultUser.id },
        ]);

        // --- SALIDAS DEMO ---
        const sal1 = await this.salidaRepo.save(
          this.salidaRepo.create({
            estado: 'DESPACHADO',
            creadoPor: defaultUser.id,
          }),
        );

        await this.salidaAttrRepo.save([
          { salidaId: sal1.id, atributoId: attrOperador.id, valor: 'Martín Silva', capturadoPor: defaultUser.id },
          { salidaId: sal1.id, atributoId: attrPlacas.id, valor: '77-JKL-2', capturadoPor: defaultUser.id },
          { salidaId: sal1.id, atributoId: attrLinea.id, valor: 'CEDIS Guadalajara', capturadoPor: defaultUser.id },
          { salidaId: sal1.id, atributoId: attrSello.id, valor: 'SL-OUT-101', capturadoPor: defaultUser.id },
        ]);

        await this.detalleSalidaRepo.save({
          salidaId: sal1.id,
          tarimaId: t1_1.id,
          registradoPor: defaultUser.id,
        });

        const sal2 = await this.salidaRepo.save(
          this.salidaRepo.create({
            estado: 'EN_PROCESO',
            creadoPor: defaultUser.id,
          }),
        );

        await this.salidaAttrRepo.save([
          { salidaId: sal2.id, atributoId: attrOperador.id, valor: 'Fernando Morales', capturadoPor: defaultUser.id },
          { salidaId: sal2.id, atributoId: attrPlacas.id, valor: '11-MNO-5', capturadoPor: defaultUser.id },
          { salidaId: sal2.id, atributoId: attrLinea.id, valor: 'Tienda Monterrey Centro', capturadoPor: defaultUser.id },
          { salidaId: sal2.id, atributoId: attrSello.id, valor: 'SL-OUT-102', capturadoPor: defaultUser.id },
        ]);

        this.logger.log('¡Datos relacionales operacionales (Recepciones, Tarimas LPN, Salidas) creados exitosamente!');
      }
    } catch (err) {
      this.logger.warn(`No se pudo sincronizar las semillas de base de datos en el inicio: ${err.message}`);
    }
  }
}

