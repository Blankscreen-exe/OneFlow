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
import { User } from './user.entity';

@Entity('client_service_providers')
@Unique(['clientId', 'serviceProviderId'])
@Index(['clientId'])
@Index(['serviceProviderId'])
export class ClientServiceProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column()
  serviceProviderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceProviderId' })
  serviceProvider: User;

  @CreateDateColumn()
  createdAt: Date;
}

