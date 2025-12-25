import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClientSourcesService } from './client-sources.service';

@ApiTags('client-sources')
@ApiBearerAuth()
@Controller('client-sources')
export class ClientSourcesController {
  constructor(private readonly clientSourcesService: ClientSourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all client sources' })
  @ApiResponse({
    status: 200,
    description: 'List of all client sources',
  })
  findAll() {
    return this.clientSourcesService.findAll();
  }
}


