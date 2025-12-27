import { User } from '../../users/entities/user.entity';
import { ClientSource } from '../../client-sources/entities/client-source.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
} from 'typeorm';

@Entity('clients')
@Index(['userId'])
@Index(['userId', 'email'], { unique: true })
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  agencyId: string;

  @ManyToOne('Agency', { nullable: true })
  @JoinColumn({ name: 'agencyId' })
  agency: Relation<any>;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  sourceId: string;

  @ManyToOne(() => ClientSource)
  @JoinColumn({ name: 'sourceId' })
  source: ClientSource;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  company: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @OneToMany('ClientContact', 'client', {
    cascade: true,
  })
  contacts: Relation<any[]>;

  // Email notification preferences (client can opt out)
  @Column({ type: 'jsonb', nullable: true })
  emailPreferences: {
    paymentConfirmationEnabled?: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
