import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';

@Entity('CATALOGO_ATRIBUTO')
export class CatalogoAtributo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, name: 'tipo_dato', default: 'texto' })
  tipoDato: string;

  @Column({ type: 'boolean', default: true })
  requerido: boolean;

  @DeleteDateColumn({ type: 'timestamp', name: 'eliminado_en', nullable: true })
  eliminadoEn: Date;
}
