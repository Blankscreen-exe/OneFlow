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
import { PaymentProviderType } from '../enums/payment-provider.enum';

@Entity('payments')
@Index(['invoiceId'])
@Index(['stripePaymentIntentId'], { unique: true })
@Index(['stripeAccountId'])
@Index(['status'])
@Index(['providerPaymentId'], { unique: true })
@Index(['paymentProvider'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key to the invoice
  @Column()
  invoiceId: string;

  @ManyToOne('Invoice', 'payments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Relation<Invoice>;

  // Payment provider type (generic)
  @Column({
    type: 'varchar',
    nullable: true,
  })
  paymentProvider: PaymentProviderType;

  // Generic provider payment ID (replaces stripePaymentIntentId for new payments)
  @Column({ unique: true, nullable: true })
  providerPaymentId: string;

  // Generic provider account ID (replaces stripeAccountId for new payments)
  @Column({ nullable: true })
  providerAccountId: string;

  // Generic provider charge ID (replaces stripeChargeId for new payments)
  @Column({ nullable: true })
  providerChargeId: string;

  // Provider-specific metadata (JSONB)
  @Column({ type: 'jsonb', nullable: true })
  providerMetadata: Record<string, any>;

  // Stripe Payment Intent ID (unique for idempotency) - kept for backward compatibility
  @Column({ unique: true, nullable: true })
  stripePaymentIntentId: string;

  // Stripe Charge ID (for refunds) - kept for backward compatibility
  @Column({ nullable: true })
  stripeChargeId: string;

  // Stripe Connect account ID (destination account) - kept for backward compatibility
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

  /**
   * Get the provider payment ID (generic or Stripe fallback for backward compatibility)
   */
  getProviderPaymentId(): string | null {
    return this.providerPaymentId || this.stripePaymentIntentId || null;
  }

  /**
   * Get the provider account ID (generic or Stripe fallback for backward compatibility)
   */
  getProviderAccountId(): string | null {
    return this.providerAccountId || this.stripeAccountId || null;
  }

  /**
   * Get the provider charge ID (generic or Stripe fallback for backward compatibility)
   */
  getProviderChargeId(): string | null {
    return this.providerChargeId || this.stripeChargeId || null;
  }
}



