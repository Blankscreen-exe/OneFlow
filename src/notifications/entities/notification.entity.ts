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
import { User } from '../../users/entities/user.entity';
import { Agency } from '../../agencies/entities/agency.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { RelatedEntityType } from '../../timeline/enums/related-entity-type.enum';

@Entity('notifications')
@Index(['type', 'relatedEntityId'])
@Index(['recipientEmail', 'sentAt'])
@Index(['userId'])
@Index(['agencyId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Notification type
  @Column({
    type: 'varchar',
  })
  type: NotificationType;

  // Recipient email address
  @Column()
  recipientEmail: string;

  // Related entity type
  @Column({
    type: 'varchar',
    nullable: true,
  })
  relatedEntityType: RelatedEntityType;

  // Related entity ID (nullable)
  @Column({ nullable: true })
  relatedEntityId: string;

  // When notification was sent
  @CreateDateColumn()
  sentAt: Date;

  // Additional metadata (JSONB)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Foreign key to user who sent/triggered (nullable)
  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>;

  // Foreign key to agency (nullable)
  @Column({ nullable: true })
  agencyId: string;

  @ManyToOne('Agency', { nullable: true })
  @JoinColumn({ name: 'agencyId' })
  agency: Relation<Agency>;
}

