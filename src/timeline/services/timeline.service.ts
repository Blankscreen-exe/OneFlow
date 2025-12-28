import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimelineEvent } from '../entities/timeline-event.entity';
import { Client } from '../../clients/entities/client.entity';
import { TimelineEventType } from '../enums/timeline-event-type.enum';
import { RelatedEntityType } from '../enums/related-entity-type.enum';
import { TimelineQueryDto } from '../dto/timeline-query.dto';
import { ClientsService } from '../../clients/clients.service';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(TimelineEvent)
    private timelineEventsRepository: Repository<TimelineEvent>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private clientsService: ClientsService,
  ) {}

  /**
   * Create a timeline event
   * Events are immutable - no update/delete
   */
  async createEvent(
    clientId: string,
    userId: string,
    type: TimelineEventType,
    title: string,
    description?: string,
    metadata?: Record<string, any>,
    relatedEntityType?: RelatedEntityType,
    relatedEntityId?: string,
  ): Promise<TimelineEvent> {
    // Validate client exists and user has access
    await this.clientsService.findOne(clientId, userId);

    // Check if event already exists (idempotency check)
    if (relatedEntityType && relatedEntityId) {
      const existingEvent = await this.timelineEventsRepository.findOne({
        where: {
          clientId,
          type,
          relatedEntityType,
          relatedEntityId,
        },
      });

      if (existingEvent) {
        return existingEvent;
      }
    }

    const event = this.timelineEventsRepository.create({
      clientId,
      userId,
      type,
      title,
      description: description || null,
      metadata: metadata || null,
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null,
    } as any);

    const saved = await this.timelineEventsRepository.save(event);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * Get timeline for a client with optional filters
   * Timeline is sorted by createdAt DESC (newest first)
   */
  async getTimeline(
    clientId: string,
    userId: string,
    filters?: TimelineQueryDto,
  ): Promise<TimelineEvent[]> {
    // Validate client ownership
    await this.clientsService.findOne(clientId, userId);

    const queryBuilder = this.timelineEventsRepository
      .createQueryBuilder('event')
      .where('event.clientId = :clientId', { clientId })
      .orderBy('event.createdAt', 'DESC');

    // Filter by event type if provided
    if (filters?.type) {
      queryBuilder.andWhere('event.type = :type', { type: filters.type });
    }

    // Apply pagination
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    queryBuilder.take(limit).skip(offset);

    return await queryBuilder.getMany();
  }

  /**
   * Add a manual note to the timeline
   */
  async addNote(
    clientId: string,
    userId: string,
    title: string,
    description?: string,
  ): Promise<TimelineEvent> {
    // Validate client ownership
    await this.clientsService.findOne(clientId, userId);

    const event = this.timelineEventsRepository.create({
      clientId,
      userId,
      type: TimelineEventType.NOTE_ADDED,
      title,
      description: description || null,
      metadata: null,
      relatedEntityType: null,
      relatedEntityId: null,
    } as any);

    const saved = await this.timelineEventsRepository.save(event);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * Get a single event by ID
   */
  async getEventById(
    eventId: string,
    userId: string,
  ): Promise<TimelineEvent> {
    const event = await this.timelineEventsRepository.findOne({
      where: { id: eventId },
      relations: ['client', 'user'],
    });

    if (!event) {
      throw new NotFoundException('Timeline event not found');
    }

    // Validate client ownership
    await this.clientsService.findOne(event.clientId, userId);

    return event;
  }
}

