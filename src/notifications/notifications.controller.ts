import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationService } from './services/notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import {
  PaginatedNotificationResponseDto,
  EmailPreferencesResponseDto,
} from './dto/notification-response.dto';
import { UpdateEmailPreferencesDto } from './dto/update-email-preferences.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get notification history' })
  @ApiResponse({
    status: 200,
    description: 'Paginated notification history',
    type: PaginatedNotificationResponseDto,
  })
  async getNotificationHistory(
    @CurrentUser() user: { id: string; email: string; agencyId?: string },
    @Query() query: NotificationQueryDto,
  ): Promise<PaginatedNotificationResponseDto> {
    return this.notificationService.getNotificationHistory(
      user.id,
      user.agencyId,
      query,
    );
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update user email preferences' })
  @ApiResponse({
    status: 200,
    description: 'Email preferences updated',
    type: EmailPreferencesResponseDto,
  })
  async updateEmailPreferences(
    @CurrentUser() user: { id: string; email: string; agencyId?: string },
    @Body() updateDto: UpdateEmailPreferencesDto,
  ): Promise<EmailPreferencesResponseDto> {
    const preferences = await this.notificationService.updateEmailPreferences(
      updateDto,
      user.id,
      user.agencyId,
    );
    return preferences;
  }

  @Patch('agencies/:id/preferences')
  @ApiOperation({ summary: 'Update agency email preferences (admin only)' })
  @ApiParam({ name: 'id', description: 'Agency UUID' })
  @ApiResponse({
    status: 200,
    description: 'Email preferences updated',
    type: EmailPreferencesResponseDto,
  })
  async updateAgencyEmailPreferences(
    @Param('id', ParseUUIDPipe) agencyId: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() updateDto: UpdateEmailPreferencesDto,
  ): Promise<EmailPreferencesResponseDto> {
    // TODO: Add agency admin check
    const preferences = await this.notificationService.updateEmailPreferences(
      updateDto,
      undefined,
      agencyId,
    );
    return preferences;
  }

  @Post('test-email')
  @ApiOperation({ summary: 'Send test email (development only)' })
  @ApiResponse({ status: 200, description: 'Test email sent' })
  @ApiResponse({ status: 403, description: 'Not allowed in production' })
  async sendTestEmail(
    @Body() body: { email: string; template: string },
  ): Promise<{ message: string }> {
    const nodeEnv = this.configService.get<string>('nodeEnv');
    if (nodeEnv === 'production') {
      throw new BadRequestException(
        'Test email endpoint is not available in production',
      );
    }

    // This is a simple test endpoint - in a real implementation,
    // you might want to send actual test emails for each template type
    return {
      message: `Test email would be sent to ${body.email} with template ${body.template}`,
    };
  }
}

