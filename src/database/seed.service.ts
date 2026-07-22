import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol, Usuario, CatalogoAtributo, CatalogoTipoEvidencia, MaestroMateriales } from '../entities';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Rol) private readonly rolRepo: Repository<Rol>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(CatalogoAtributo) private readonly atributoRepo: Repository<CatalogoAtributo>,
    @InjectRepository(CatalogoTipoEvidencia) private readonly evidenciaRepo: Repository<CatalogoTipoEvidencia>,
    @InjectRepository(MaestroMateriales) private readonly materialRepo: Repository<MaestroMateriales>,
  ) {}

  async onModuleInit() {
    this.logger.log('Verificando y ejecutando semillas de base de datos...');

    // 1. Poblado de Roles y Permisos Básicos Estándar WMS
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
        // Actualizar descripcion y permisos si faltan
        existe.descripcion = rData.descripcion;
        existe.permisos = rData.permisos;
        await this.rolRepo.save(existe);
      }
    }
    this.logger.log('Roles y Permisos iniciales sincronizados.');

    const adminRol = await this.rolRepo.findOne({ where: { nombre: 'Administrador de Almacén' } });
    const operadorRol = await this.rolRepo.findOne({ where: { nombre: 'Operador de Recepción & Inbound' } });

    // 2. Usuarios demo
    const usuarioCount = await this.usuarioRepo.count();
    if (usuarioCount === 0 && adminRol) {
      await this.usuarioRepo.save([
        {
          nombreCompleto: 'Administrador General WMS',
          email: 'admin@coorsa.com',
          passwordHash: 'Coorsa#2026!',
          rolId: adminRol.id,
          activo: true,
        },
        {
          nombreCompleto: 'Juan Pérez (Operador Inbound)',
          email: 'juan.perez@coorsa.com',
          passwordHash: 'Coorsa#2026!',
          rolId: operadorRol ? operadorRol.id : adminRol.id,
          activo: true,
        },
      ]);
      this.logger.log('Usuarios demo iniciales creados.');
    }

    // 3. Catálogo Atributos de Llegada
    const atributoCount = await this.atributoRepo.count();
    if (atributoCount === 0) {
      await this.atributoRepo.save([
        { nombre: 'Nombre de Operador', tipoDato: 'texto', requerido: true },
        { nombre: 'Placas de Unidad', tipoDato: 'texto', requerido: true },
        { nombre: 'Línea de Transporte', tipoDato: 'texto', requerido: true },
        { nombre: 'Número de Sello', tipoDato: 'texto', requerido: true },
      ]);
      this.logger.log('Atributos de Llegada iniciales creados.');
    }

    // 4. Catálogo Tipo Evidencia
    const evidenciaCount = await this.evidenciaRepo.count();
    if (evidenciaCount === 0) {
      await this.evidenciaRepo.save([
        { nombre: 'Fotografía Fachada Exterior' },
        { nombre: 'Fotografía Puertas Abiertas' },
        { nombre: 'Fotografía Tarima Armada' },
        { nombre: 'PDF Remisión de Embarque' },
      ]);
      this.logger.log('Tipos de Evidencia iniciales creados.');
    }

    // 5. Maestro de Materiales Demo
    const materialCount = await this.materialRepo.count();
    if (materialCount === 0) {
      await this.materialRepo.save([
        { sku: 'SKU-ELEC-001', descripcion: 'Televisor Smart TV 55" 4K UHD', cliente: 'COORSA' },
        { sku: 'SKU-ELEC-002', descripcion: 'Equipo de Minicomponente Hi-Fi 300W', cliente: 'COORSA' },
        { sku: 'SKU-ELEC-003', descripcion: 'Consola de Videojuegos 1TB SSD', cliente: 'COORSA' },
        { sku: 'SKU-ELEC-004', descripcion: 'Monitor Gamer 27" Curved 165Hz', cliente: 'COORSA' },
      ]);
      this.logger.log('Maestro de Materiales demo poblado.');
    }
  }
}
