import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Rol } from './rol.entity';

@Entity('USUARIO')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'rol_id' })
  rolId: number;

  @ManyToOne(() => Rol, (rol) => rol.usuarios)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @Column({ type: 'varchar', length: 150, name: 'nombre_completo' })
  nombreCompleto: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'fecha_creacion' })
  fechaCreacion: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'eliminado_en', nullable: true })
  eliminadoEn: Date;
}
