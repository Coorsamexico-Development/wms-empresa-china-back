import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SalidaDespacho } from './salida-despacho.entity';
import { Tarima } from './tarima.entity';
import { Usuario } from './usuario.entity';

@Entity('DETALLE_SALIDA')
export class DetalleSalida {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'salida_id' })
  salidaId: number;

  @ManyToOne(() => SalidaDespacho, (salida) => salida.detalles)
  @JoinColumn({ name: 'salida_id' })
  salida: SalidaDespacho;

  @Column({ name: 'tarima_id' })
  tarimaId: number;

  @ManyToOne(() => Tarima)
  @JoinColumn({ name: 'tarima_id' })
  tarima: Tarima;

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
