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
import type { Proposal } from '../../proposals/entities/proposal.entity';
import { InvoiceItem } from './invoice-item.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
}

@Entity('invoices')
@Index(['userId'])
@Index(['agencyId'])
@Index(['clientId'])
@Index(['proposalId'])
@Index(['status'])
@Index(['userId', 'invoiceNumber'], { unique: true })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key to the user who owns this invoice (service provider) - for backward compatibility
  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Foreign key to the agency that owns this invoice
  @Column({ nullable: true })
  agencyId: string;

  @ManyToOne('Agency', { nullable: true })
  @JoinColumn({ name: 'agencyId' })
  agency: Relation<any>;

  // Foreign key to the user who created this invoice
  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  // Foreign key to the client this invoice is for
  @Column()
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  // Foreign key to the proposal this invoice was generated from
  @Column({ nullable: true })
  proposalId: string;

  @ManyToOne('Proposal', { nullable: true })
  @JoinColumn({ name: 'proposalId' })
  proposal: Relation<Proposal>;

  // Invoice number (unique per user)
  @Column()
  invoiceNumber: string;

  // Current status of the invoice
  @Column({
    type: 'varchar',
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  // Calculated fields for pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  // Due date
  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  // Stripe payment link ID
  @Column({ nullable: true })
  stripePaymentLinkId: string;

  // Additional notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // When the invoice was sent
  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  // When the invoice was paid
  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  // Unique token for public invoice access
  @Column({ unique: true, nullable: true })
  @Index()
  accessToken: string;

  // One invoice has many items
  @OneToMany(() => InvoiceItem, (item) => item.invoice, {
    cascade: true,
    eager: true,
  })
  items: Relation<InvoiceItem[]>;
}

