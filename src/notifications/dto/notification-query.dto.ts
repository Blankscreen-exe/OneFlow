import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum, IsUUID, IsString, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../enums/notification-type.enum';
import { RelatedEntityType } from '../../timeline/enums/related-entity-type.enum';

export class NotificationQueryDto {
  @ApiProperty({
    example: 1,
    description: 'Page number for pagination',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    enum: NotificationType,
    description: 'Filter notifications by type',
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({
    enum: RelatedEntityType,
    description: 'Filter by related entity type',
    required: false,
  })
  @IsOptional()
  @IsEnum(RelatedEntityType)
  relatedEntityType?: RelatedEntityType;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by related entity ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;

  @ApiProperty({
    example: 'client@example.com',
    description: 'Filter by recipient email',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiProperty({
    example: '2023-01-01',
    description: 'Filter notifications sent after this date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    example: '2023-12-31',
    description: 'Filter notifications sent before this date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  dateTo?: string;
}

