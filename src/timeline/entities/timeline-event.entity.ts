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
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { TimelineEventType } from '../enums/timeline-event-type.enum';
import { RelatedEntityType } from '../enums/related-entity-type.enum';

@Entity('client_timeline_events')
@Index(['clientId'])
@Index(['type'])
@Index(['createdAt'])
@Index(['relatedEntityType', 'relatedEntityId'])
export class TimelineEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Foreign key to the client
  @Column()
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Relation<Client>;

  // Foreign key to the user who created the event
  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  // Event type
  @Column({
    type: 'varchar',
  })
  type: TimelineEventType;

  // Event title (e.g., "Proposal Created", "Payment Received")
  @Column()
  title: string;

  // Detailed description (nullable)
  @Column({ type: 'text', nullable: true })
  description: string;

  // Metadata for storing related entity data (JSONB)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Related entity type (nullable)
  @Column({
    type: 'varchar',
    nullable: true,
  })
  relatedEntityType: RelatedEntityType;

  // Related entity ID (nullable)
  @Column({ nullable: true })
  relatedEntityId: string;

  @CreateDateColumn()
  createdAt: Date;
}

