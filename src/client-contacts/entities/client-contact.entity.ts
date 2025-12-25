import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import type { Client } from '../../clients/entities/client.entity';

export enum ContactType {
  EMAIL = 'email',
  PHONE = 'phone',
  UPWORK = 'upwork',
  LINKEDIN = 'linkedin',
  FREELANCER = 'freelancer',
  GURU = 'guru',
  OTHER = 'other',
}

@Entity('client_contacts')
@Index(['clientId'])
export class ClientContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @ManyToOne('Client', 'contacts', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Relation<Client>;

  @Column({
    type: 'varchar',
  })
  type: ContactType;

  @Column()
  value: string;

  @Column({ nullable: true })
  label: string;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: false })
  isPrimaryPhone: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

