import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SalidaDespacho } from './salida-despacho.entity';
import { CatalogoAtributo } from './catalogo-atributo.entity';
import { Usuario } from './usuario.entity';

@Entity('SALIDA_ATRIBUTO')
export class SalidaAtributo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'salida_id' })
  salidaId: number;

  @ManyToOne(() => SalidaDespacho, (salida) => salida.atributos)
  @JoinColumn({ name: 'salida_id' })
  salida: SalidaDespacho;

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
