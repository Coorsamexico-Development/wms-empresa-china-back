import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Recepcion } from './recepcion.entity';
import { Usuario } from './usuario.entity';
import { DetalleTarima } from './detalle-tarima.entity';
import { EvidenciaTarima } from './evidencia-tarima.entity';

@Entity('TARIMA')
export class Tarima {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'recepcion_id' })
  recepcionId: number;

  @ManyToOne(() => Recepcion, (recepcion) => recepcion.tarimas)
  @JoinColumn({ name: 'recepcion_id' })
  recepcion: Recepcion;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'lpn_codigo' })
  lpnCodigo: string;

  @Column({ type: 'varchar', length: 50, default: 'EN_ARMADO' })
  estado: string;

  @Column({ name: 'armado_por' })
  armadoPor: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'armado_por' })
  armador: Usuario;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_creacion' })
  fechaCreacion: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'eliminado_en', nullable: true })
  eliminadoEn: Date;

  @OneToMany(() => DetalleTarima, (detalle) => detalle.tarima)
  detalles: DetalleTarima[];

  @OneToMany(() => EvidenciaTarima, (evidencia) => evidencia.tarima)
  evidencias: EvidenciaTarima[];
}
