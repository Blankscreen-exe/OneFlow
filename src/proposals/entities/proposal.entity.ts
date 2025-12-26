import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import type { ProposalItem } from './proposal-item.entity';

// Define the possible statuses for a proposal
export enum ProposalStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('proposals')
@Index(['userId'])
@Index(['clientId'])
@Index(['status'])
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key to the user who owns this proposal
  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Foreign key to the client this proposal is for
  @Column()
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  // Proposal title/subject
  @Column()
  title: string;

  // Current status of the proposal
  @Column({
    type: 'varchar',
    default: ProposalStatus.DRAFT,
  })
  status: ProposalStatus;

  // Date until which the proposal is valid
  @Column({ type: 'date', nullable: true })
  validUntil: Date;

  // Calculated fields for pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  // Additional notes for the proposal
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Cover letter text for the proposal (e.g., Upwork application)
  @Column({ type: 'text', nullable: true })
  coverLetter: string;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // When the proposal was sent to the client
  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  // When the proposal was accepted
  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  // When the proposal was rejected
  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  // Unique token for public proposal access
  @Column({ unique: true, nullable: true })
  @Index()
  acceptanceToken: string;

  // One proposal has many items
  @OneToMany('ProposalItem', 'proposal', {
    cascade: true,
    eager: true,
  })
  items: Relation<ProposalItem[]>;

  // Contact methods used to send this proposal
  @OneToMany('ProposalContactMethod', 'proposal', {
    cascade: true,
  })
  sentViaContacts: Relation<any[]>;
}
