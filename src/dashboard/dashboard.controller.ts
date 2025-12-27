import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './services/dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    type: DashboardResponseDto,
  })
  async getDashboard(
    @CurrentUser() user: { id: string; email: string; agencyId?: string },
  ): Promise<DashboardResponseDto> {
    // If user belongs to an agency, aggregate data for the agency
    // Otherwise, show individual user dashboard
    return this.dashboardService.getDashboardData(user.id, user.agencyId);
  }
}

