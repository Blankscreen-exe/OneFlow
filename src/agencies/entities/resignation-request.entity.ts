import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Agency } from './agency.entity';
import { User } from '../../users/entities/user.entity';

export enum ResignationRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('resignation_requests')
@Index(['agencyId'])
@Index(['userId'])
@Index(['status'])
export class ResignationRequest {
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

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'simple-enum',
    enum: ResignationRequestStatus,
    default: ResignationRequestStatus.PENDING,
  })
  status: ResignationRequestStatus;

  @CreateDateColumn()
  requestedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  processedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processedById' })
  processedBy: User;
}




