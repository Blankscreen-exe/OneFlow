import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StripeOnboardingStatus } from '../../payments/enums/stripe-onboarding-status.enum';
import { PaymentProviderType } from '../../payments/enums/payment-provider.enum';
import { PaymentOnboardingStatus } from '../../payments/enums/payment-onboarding-status.enum';

@Entity('agencies')
export class Agency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ nullable: true })
  logo: string;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany('AgencyMembership', 'agency')
  memberships: Relation<any[]>;

  // Default payment provider
  @Column({
    type: 'varchar',
    default: PaymentProviderType.STRIPE,
  })
  defaultPaymentProvider: PaymentProviderType;

  // Generic payment provider account ID
  @Column({ nullable: true })
  paymentProviderAccountId: string;

  // Generic payment onboarding status
  @Column({
    type: 'varchar',
    nullable: true,
  })
  paymentOnboardingStatus: PaymentOnboardingStatus;

  // Generic payment onboarding link (temporary, expires)
  @Column({ nullable: true })
  paymentOnboardingLink: string;

  // When payment onboarding was completed
  @Column({ type: 'timestamp', nullable: true })
  paymentOnboardingCompletedAt: Date;

  // Stripe Connect account ID (admin's account) - kept for backward compatibility
  @Column({ unique: true, nullable: true })
  stripeAccountId: string;

  // Stripe onboarding status - kept for backward compatibility
  @Column({
    type: 'varchar',
    default: StripeOnboardingStatus.NOT_STARTED,
  })
  stripeOnboardingStatus: StripeOnboardingStatus;

  // Platform fee rate (percentage, default 10%)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  platformFeeRate: number;

  // Stripe onboarding link (temporary, expires) - kept for backward compatibility
  @Column({ nullable: true })
  stripeOnboardingLink: string;

  // When onboarding was completed - kept for backward compatibility
  @Column({ type: 'timestamp', nullable: true })
  stripeOnboardingCompletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Get the payment account ID for a specific provider (or default provider)
   * Falls back to Stripe account ID for backward compatibility
   */
  getPaymentAccountId(provider?: PaymentProviderType): string | null {
    const targetProvider = provider || this.defaultPaymentProvider;
    
    if (targetProvider === PaymentProviderType.STRIPE) {
      return this.paymentProviderAccountId || this.stripeAccountId || null;
    }
    
    // For future providers, use paymentProviderAccountId
    return this.paymentProviderAccountId || null;
  }
}

