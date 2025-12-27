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
import type { Invoice } from '../../invoices/entities/invoice.entity';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity('payments')
@Index(['invoiceId'])
@Index(['stripePaymentIntentId'], { unique: true })
@Index(['stripeAccountId'])
@Index(['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key to the invoice
  @Column()
  invoiceId: string;

  @ManyToOne('Invoice', 'payments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Relation<Invoice>;

  // Stripe Payment Intent ID (unique for idempotency)
  @Column({ unique: true, nullable: true })
  stripePaymentIntentId: string;

  // Stripe Charge ID (for refunds)
  @Column({ nullable: true })
  stripeChargeId: string;

  // Stripe Connect account ID (destination account)
  @Column({ nullable: true })
  stripeAccountId: string;

  // Payment amount (to service provider, before platform fee)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // Platform fee amount collected
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  // Platform fee rate used (percentage)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  platformFeeRate: number;

  // Payment status
  @Column({
    type: 'varchar',
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  // Payment method type (card, bank_transfer, etc.)
  @Column({ nullable: true })
  paymentMethod: string;

  // Refund flag
  @Column({ default: false })
  refunded: boolean;

  // Amount refunded
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number;

  // Additional metadata (JSON)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}



