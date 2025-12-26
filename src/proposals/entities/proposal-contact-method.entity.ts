import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import type { Proposal } from './proposal.entity';
import type { ClientContact } from '../../client-contacts/entities/client-contact.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';

@Entity('proposal_contact_methods')
@Index(['proposalId'])
export class ProposalContactMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  proposalId: string;

  @ManyToOne('Proposal', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposalId' })
  proposal: Relation<Proposal>;

  @Column()
  contactId: string;

  @ManyToOne('ClientContact', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contactId' })
  contact: Relation<ClientContact>;

  // When sent via this contact method
  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  // Delivery status for this contact method
  @Column({
    type: 'varchar',
    default: DeliveryStatus.PENDING,
  })
  deliveryStatus: DeliveryStatus;

  // Whether client accepted via this contact method
  @Column({ default: false })
  acceptedVia: boolean;

  // Error message if delivery failed
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}

