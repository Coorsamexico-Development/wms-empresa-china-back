import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Recepcion } from './recepcion.entity';
import { CatalogoAtributo } from './catalogo-atributo.entity';
import { Usuario } from './usuario.entity';

@Entity('RECEPCION_ATRIBUTO')
export class RecepcionAtributo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'recepcion_id' })
  recepcionId: number;

  @ManyToOne(() => Recepcion, (recepcion) => recepcion.atributos)
  @JoinColumn({ name: 'recepcion_id' })
  recepcion: Recepcion;

  @Column({ name: 'atributo_id' })
  atributoId: number;

  @ManyToOne(() => CatalogoAtributo)
  @JoinColumn({ name: 'atributo_id' })
  atributo: CatalogoAtributo;

  @Column({ type: 'text' })
  valor: string;

  @Column({ name: 'capturado_por' })
  capturadoPor: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'capturado_por' })
  capturador: Usuario;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_creacion' })
  fechaCreacion: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'eliminado_en', nullable: true })
  eliminadoEn: Date;
}
