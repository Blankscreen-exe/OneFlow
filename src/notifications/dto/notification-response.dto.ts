import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';
import { RelatedEntityType } from '../../timeline/enums/related-entity-type.enum';

export class NotificationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.INVOICE_SENT })
  type: NotificationType;

  @ApiProperty({ example: 'client@example.com' })
  recipientEmail: string;

  @ApiProperty({ enum: RelatedEntityType, example: RelatedEntityType.INVOICE, nullable: true })
  relatedEntityType: RelatedEntityType | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', nullable: true })
  relatedEntityId: string | null;

  @ApiProperty({ example: '2023-10-27T10:00:00.000Z' })
  sentAt: Date;

  @ApiProperty({ example: { invoiceNumber: 'INV-2023-001' }, nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', nullable: true })
  userId: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', nullable: true })
  agencyId: string | null;
}

export class PaginatedNotificationResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data: NotificationResponseDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 50,
      totalPages: 5,
      hasNext: true,
      hasPrev: false,
    },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class EmailPreferencesResponseDto {
  @ApiProperty({ example: true })
  paymentConfirmationEnabled: boolean;

  @ApiProperty({ example: true })
  invoiceRemindersEnabled: boolean;

  @ApiProperty({ example: [7, 14, 30], type: [Number] })
  overdueReminderDays: number[];
}

