import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SalidaDespacho } from './salida-despacho.entity';
import { CatalogoTipoEvidencia } from './catalogo-tipo-evidencia.entity';
import { Usuario } from './usuario.entity';

@Entity('EVIDENCIA_SALIDA')
export class EvidenciaSalida {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'salida_id' })
  salidaId: number;

  @ManyToOne(() => SalidaDespacho, (salida) => salida.evidencias)
  @JoinColumn({ name: 'salida_id' })
  salida: SalidaDespacho;

  @Column({ name: 'tipo_evidencia_id' })
  tipoEvidenciaId: number;

  @ManyToOne(() => CatalogoTipoEvidencia)
  @JoinColumn({ name: 'tipo_evidencia_id' })
  tipoEvidencia: CatalogoTipoEvidencia;

  @Column({ type: 'longtext', name: 'url_archivo' })
  urlArchivo: string;

  @Column({ name: 'subido_por' })
  subidoPor: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'subido_por' })
  usuario: Usuario;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_creacion' })
  fechaCreacion: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'eliminado_en', nullable: true })
  eliminadoEn: Date;
}
