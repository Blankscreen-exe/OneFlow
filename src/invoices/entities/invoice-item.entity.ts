import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import type { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key to the parent invoice
  @Column()
  invoiceId: string;

  @ManyToOne('Invoice', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Relation<Invoice>;

  // Description of the line item
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

  // Order/position of this item in the invoice
  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}

