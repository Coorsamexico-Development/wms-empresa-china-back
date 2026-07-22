import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tarima } from './tarima.entity';
import { CatalogoTipoEvidencia } from './catalogo-tipo-evidencia.entity';
import { Usuario } from './usuario.entity';

@Entity('EVIDENCIA_TARIMA')
export class EvidenciaTarima {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tarima_id' })
  tarimaId: number;

  @ManyToOne(() => Tarima, (tarima) => tarima.evidencias)
  @JoinColumn({ name: 'tarima_id' })
  tarima: Tarima;

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
