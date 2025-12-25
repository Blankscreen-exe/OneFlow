import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ClientContactsService } from './client-contacts.service';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateClientContactDto } from './dto/update-client-contact.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('client-contacts')
@ApiBearerAuth()
@Controller('clients/:clientId/contacts')
export class ClientContactsController {
  constructor(
    private readonly clientContactsService: ClientContactsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contact for a client' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  create(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() createContactDto: CreateClientContactDto,
  ) {
    return this.clientContactsService.create(
      clientId,
      user.id,
      createContactDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all contacts for a client' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'List of contacts' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  findAll(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.clientContactsService.findAll(clientId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by ID' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact details' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  findOne(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.clientContactsService.findOne(clientId, id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact updated' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  update(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
    @Body() updateContactDto: UpdateClientContactDto,
  ) {
    return this.clientContactsService.update(
      clientId,
      id,
      user.id,
      updateContactDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 204, description: 'Contact deleted' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  remove(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.clientContactsService.remove(clientId, id, user.id);
  }

  @Post(':id/set-primary')
  @ApiOperation({ summary: 'Set a contact as primary' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Contact set as primary' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  setPrimary(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.clientContactsService.setPrimary(clientId, id, user.id);
  }

  @Post(':id/set-primary-phone')
  @ApiOperation({ summary: 'Set a phone contact as primary phone' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiParam({ name: 'id', description: 'Contact UUID' })
  @ApiResponse({ status: 200, description: 'Phone contact set as primary' })
  @ApiResponse({ status: 400, description: 'Contact is not a phone type' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  setPrimaryPhone(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.clientContactsService.setPrimaryPhone(clientId, id, user.id);
  }
}

