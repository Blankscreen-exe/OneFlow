import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { ClientServiceProvider } from './client-service-provider.entity';
import { StripeOnboardingStatus } from '../../payments/enums/stripe-onboarding-status.enum';
import { PaymentProviderType } from '../../payments/enums/payment-provider.enum';
import { PaymentOnboardingStatus } from '../../payments/enums/payment-onboarding-status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({
    type: 'simple-enum',
    enum: Role,
    default: Role.SERVICE_PROVIDER,
  })
  role: Role;

  // Relationships for clients (when user is a client)
  @OneToMany(() => ClientServiceProvider, (csp) => csp.client)
  clientRelationships: Relation<ClientServiceProvider[]>;

  // Relationships for service providers (when user is a service provider)
  @OneToMany(() => ClientServiceProvider, (csp) => csp.serviceProvider)
  serviceProviderRelationships: Relation<ClientServiceProvider[]>;

  // Agency relationship (if user belongs to an agency)
  @Column({ nullable: true })
  agencyId?: string;

  @ManyToOne('Agency', { nullable: true })
  @JoinColumn({ name: 'agencyId' })
  agency: Relation<any>;

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

  // Stripe Connect account ID - kept for backward compatibility
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

