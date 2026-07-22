import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';
import { RecepcionAtributo } from './recepcion-atributo.entity';
import { EvidenciaRecepcion } from './evidencia-recepcion.entity';
import { Tarima } from './tarima.entity';

@Entity('RECEPCION')
export class Recepcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, default: 'EN_DESCARGA' })
  estado: string;

  @Column({ name: 'creado_por' })
  creadoPor: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creado_por' })
  creador: Usuario;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'actualizado_por', nullable: true })
  actualizadoPor: number;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'actualizado_por' })
  actualizador: Usuario;

  @UpdateDateColumn({ type: 'timestamp', name: 'fecha_actualizacion', nullable: true })
  fechaActualizacion: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'eliminado_en', nullable: true })
  eliminadoEn: Date;

  @OneToMany(() => RecepcionAtributo, (atributo) => atributo.recepcion)
  atributos: RecepcionAtributo[];

  @OneToMany(() => EvidenciaRecepcion, (evidencia) => evidencia.recepcion)
  evidencias: EvidenciaRecepcion[];

  @OneToMany(() => Tarima, (tarima) => tarima.recepcion)
  tarimas: Tarima[];
}
