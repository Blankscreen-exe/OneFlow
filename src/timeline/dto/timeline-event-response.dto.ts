import { ApiProperty } from '@nestjs/swagger';
import { TimelineEventType } from '../enums/timeline-event-type.enum';
import { RelatedEntityType } from '../enums/related-entity-type.enum';

export class TimelineEventResponseDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'Client ID' })
  clientId: string;

  @ApiProperty({ description: 'User ID who created the event' })
  userId: string;

  @ApiProperty({ enum: TimelineEventType, description: 'Event type' })
  type: TimelineEventType;

  @ApiProperty({ description: 'Event title' })
  title: string;

  @ApiProperty({ description: 'Event description', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Event metadata',
    type: 'object',
    nullable: true,
    additionalProperties: true,
  })
  metadata: Record<string, any> | null;

  @ApiProperty({
    enum: RelatedEntityType,
    description: 'Related entity type',
    nullable: true,
  })
  relatedEntityType: RelatedEntityType | null;

  @ApiProperty({
    description: 'Related entity ID',
    nullable: true,
  })
  relatedEntityId: string | null;

  @ApiProperty({ description: 'Event creation timestamp' })
  createdAt: Date;
}

