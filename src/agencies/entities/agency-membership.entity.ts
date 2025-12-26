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
import { User } from '../../users/entities/user.entity';
import { AgencyRole } from '../../common/enums/agency-role.enum';

@Entity('agency_memberships')
@Unique(['agencyId', 'userId'])
@Index(['agencyId'])
@Index(['userId'])
@Index(['role'])
export class AgencyMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  agencyId: string;

  @ManyToOne(() => Agency, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agencyId' })
  agency: Agency;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'simple-enum',
    enum: AgencyRole,
  })
  role: AgencyRole;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

