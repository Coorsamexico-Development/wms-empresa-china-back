import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';
import { SalidaAtributo } from './salida-atributo.entity';
import { DetalleSalida } from './detalle-salida.entity';
import { EvidenciaSalida } from './evidencia-salida.entity';

@Entity('SALIDA_DESPACHO')
export class SalidaDespacho {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, default: 'EN_PROCESO' })
  estado: string;

  @Column({ name: 'creado_por' })
  creadoPor: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'creado_por' })
  creador: Usuario;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_creacion' })
  fechaCreacion: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'eliminado_en', nullable: true })
  eliminadoEn: Date;

  @OneToMany(() => SalidaAtributo, (atributo) => atributo.salida)
  atributos: SalidaAtributo[];

  @OneToMany(() => DetalleSalida, (detalle) => detalle.salida)
  detalles: DetalleSalida[];

  @OneToMany(() => EvidenciaSalida, (evidencia) => evidencia.salida)
  evidencias: EvidenciaSalida[];
}
