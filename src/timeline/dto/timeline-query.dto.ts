import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TimelineEventType } from '../enums/timeline-event-type.enum';

export class TimelineQueryDto {
  @ApiProperty({
    enum: TimelineEventType,
    description: 'Filter by event type',
    required: false,
  })
  @IsOptional()
  @IsEnum(TimelineEventType)
  type?: TimelineEventType;

  @ApiProperty({
    description: 'Number of events to return',
    required: false,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiProperty({
    description: 'Number of events to skip',
    required: false,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

