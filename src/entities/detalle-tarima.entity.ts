import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tarima } from './tarima.entity';
import { MaestroMateriales } from './maestro-materiales.entity';
import { Usuario } from './usuario.entity';

@Entity('DETALLE_TARIMA')
export class DetalleTarima {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tarima_id' })
  tarimaId: number;

  @ManyToOne(() => Tarima, (tarima) => tarima.detalles)
  @JoinColumn({ name: 'tarima_id' })
  tarima: Tarima;

  @Column({ name: 'material_id' })
  materialId: number;

  @ManyToOne(() => MaestroMateriales)
  @JoinColumn({ name: 'material_id' })
  material: MaestroMateriales;

  @Column({ type: 'int', name: 'cantidad_cajas' })
  cantidadCajas: number;

  @Column({ name: 'registrado_por' })
  registradoPor: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'registrado_por' })
  registrador: Usuario;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_creacion' })
  fechaCreacion: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'eliminado_en', nullable: true })
  eliminadoEn: Date;
}
