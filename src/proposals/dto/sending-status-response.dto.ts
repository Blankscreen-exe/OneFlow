import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '../enums/delivery-status.enum';

export class ContactMethodStatusDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  contactId: string;

  @ApiProperty()
  contactType: string;

  @ApiProperty()
  contactValue: string;

  @ApiProperty({ enum: DeliveryStatus })
  deliveryStatus: DeliveryStatus;

  @ApiProperty({ required: false })
  sentAt?: Date;

  @ApiProperty()
  acceptedVia: boolean;

  @ApiProperty({ required: false })
  errorMessage?: string;
}

export class SendingStatusResponseDto {
  @ApiProperty()
  proposalId: string;

  @ApiProperty({ type: [ContactMethodStatusDto] })
  contactMethods: ContactMethodStatusDto[];

  @ApiProperty()
  totalSent: number;

  @ApiProperty()
  totalDelivered: number;

  @ApiProperty()
  totalFailed: number;
}

