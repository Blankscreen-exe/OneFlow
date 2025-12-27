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

  // Stripe Connect account ID (admin's account)
  @Column({ unique: true, nullable: true })
  stripeAccountId: string;

  // Stripe onboarding status
  @Column({
    type: 'varchar',
    default: StripeOnboardingStatus.NOT_STARTED,
  })
  stripeOnboardingStatus: StripeOnboardingStatus;

  // Platform fee rate (percentage, default 10%)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.0 })
  platformFeeRate: number;

  // Stripe onboarding link (temporary, expires)
  @Column({ nullable: true })
  stripeOnboardingLink: string;

  // When onboarding was completed
  @Column({ type: 'timestamp', nullable: true })
  stripeOnboardingCompletedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

