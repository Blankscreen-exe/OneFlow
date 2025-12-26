import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Agency } from './agency.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';

@Entity('client_assignments')
@Unique(['agencyId', 'clientId'])
@Index(['agencyId'])
@Index(['clientId'])
@Index(['businessDeveloperId'])
export class ClientAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  agencyId: string;

  @ManyToOne(() => Agency, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agencyId' })
  agency: Agency;

  @Column()
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  businessDeveloperId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessDeveloperId' })
  businessDeveloper: User;

  @Column()
  assignedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedById' })
  assignedBy: User;

  @CreateDateColumn()
  assignedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;
}

