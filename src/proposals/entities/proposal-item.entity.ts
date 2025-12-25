import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import type { Proposal } from './proposal.entity';

@Entity('proposal_items')
export class ProposalItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key to the parent proposal
  @Column()
  proposalId: string;

  @ManyToOne('Proposal', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposalId' })
  proposal: Relation<Proposal>;

  // Description of the line item (e.g., "Website Development")
  @Column()
  description: string;

  // Quantity of items
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity: number;

  // Price per unit
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  // Total for this line item (quantity * unitPrice)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // Order/position of this item in the proposal
  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
