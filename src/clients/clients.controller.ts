import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({
    status: 201,
    description: 'Client created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - email already exists for this user',
  })
  create(
    @CurrentUser() user: { id: string; email: string },
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientsService.create(user.id, createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients with pagination, search, and sorting' })
  @ApiResponse({
    status: 200,
    description: 'List of clients retrieved successfully',
  })
  findAll(
    @CurrentUser() user: { id: string; email: string },
    @Query() query: ClientQueryDto,
  ) {
    return this.clientsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: 200,
    description: 'Client retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.clientsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: 200,
    description: 'Client updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - email already exists for this user',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(id, user.id, updateClientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a client' })
  @ApiParam({ name: 'id', description: 'Client UUID' })
  @ApiResponse({
    status: 204,
    description: 'Client deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Client not found',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.clientsService.remove(id, user.id);
  }
}


