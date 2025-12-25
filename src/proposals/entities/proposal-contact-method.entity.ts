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

  @CreateDateColumn()
  createdAt: Date;
}

