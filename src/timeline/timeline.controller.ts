import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TimelineService } from './services/timeline.service';
import { TimelineQueryDto } from './dto/timeline-query.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { TimelineEventResponseDto } from './dto/timeline-event-response.dto';

@ApiTags('timeline')
@ApiBearerAuth()
@Controller('clients')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get client timeline' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: 200,
    description: 'Timeline retrieved successfully',
    type: [TimelineEventResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getTimeline(
    @Param('id', ParseUUIDPipe) clientId: string,
    @CurrentUser() user: { id: string; email: string },
    @Query() query: TimelineQueryDto,
  ): Promise<TimelineEventResponseDto[]> {
    const events = await this.timelineService.getTimeline(
      clientId,
      user.id,
      query,
    );
    return events.map((event) => ({
      id: event.id,
      clientId: event.clientId,
      userId: event.userId,
      type: event.type,
      title: event.title,
      description: event.description,
      metadata: event.metadata,
      relatedEntityType: event.relatedEntityType,
      relatedEntityId: event.relatedEntityId,
      createdAt: event.createdAt,
    }));
  }

  @Post(':id/timeline/notes')
  @ApiOperation({ summary: 'Add note to client timeline' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: 201,
    description: 'Note added successfully',
    type: TimelineEventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async addNote(
    @Param('id', ParseUUIDPipe) clientId: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() addNoteDto: AddNoteDto,
  ): Promise<TimelineEventResponseDto> {
    const event = await this.timelineService.addNote(
      clientId,
      user.id,
      addNoteDto.title,
      addNoteDto.description,
    );
    return {
      id: event.id,
      clientId: event.clientId,
      userId: event.userId,
      type: event.type,
      title: event.title,
      description: event.description,
      metadata: event.metadata,
      relatedEntityType: event.relatedEntityType,
      relatedEntityId: event.relatedEntityId,
      createdAt: event.createdAt,
    };
  }

  @Get('timeline/events/:id')
  @ApiOperation({ summary: 'Get single timeline event details' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully',
    type: TimelineEventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventById(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<TimelineEventResponseDto> {
    const event = await this.timelineService.getEventById(eventId, user.id);
    return {
      id: event.id,
      clientId: event.clientId,
      userId: event.userId,
      type: event.type,
      title: event.title,
      description: event.description,
      metadata: event.metadata,
      relatedEntityType: event.relatedEntityType,
      relatedEntityId: event.relatedEntityId,
      createdAt: event.createdAt,
    };
  }
}

