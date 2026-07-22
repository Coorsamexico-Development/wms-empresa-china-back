import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Recepcion } from './recepcion.entity';
import { CatalogoTipoEvidencia } from './catalogo-tipo-evidencia.entity';
import { Usuario } from './usuario.entity';

@Entity('EVIDENCIA_RECEPCION')
export class EvidenciaRecepcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'recepcion_id' })
  recepcionId: number;

  @ManyToOne(() => Recepcion, (recepcion) => recepcion.evidencias)
  @JoinColumn({ name: 'recepcion_id' })
  recepcion: Recepcion;

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
