import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientContact, ContactType } from './entities/client-contact.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { UpdateClientContactDto } from './dto/update-client-contact.dto';

@Injectable()
export class ClientContactsService {
  constructor(
    @InjectRepository(ClientContact)
    private clientContactsRepository: Repository<ClientContact>,
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  /**
   * Validates that the client exists and belongs to the user
   */
  private async validateClientOwnership(
    clientId: string,
    userId: string,
  ): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id: clientId, userId },
    });
    if (!client) {
      throw new NotFoundException(
        'Client not found or does not belong to you',
      );
    }
    return client;
  }

  /**
   * Validates contact value based on type
   */
  private validateContact(
    type: ContactType,
    value: string,
    bypassValidation: boolean = false,
  ): void {
    if (bypassValidation) return;

    switch (type) {
      case ContactType.EMAIL:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new BadRequestException('Invalid email format');
        }
        break;
      case ContactType.PHONE:
        // Basic phone validation - allow digits, spaces, dashes, parentheses, plus
        const phoneRegex = /^[\d\s\-+()]+$/;
        if (!phoneRegex.test(value) || value.length < 7) {
          throw new BadRequestException('Invalid phone number format');
        }
        break;
      case ContactType.UPWORK:
      case ContactType.LINKEDIN:
      case ContactType.FREELANCER:
      case ContactType.GURU:
      case ContactType.OTHER:
        try {
          new URL(value);
        } catch {
          throw new BadRequestException('Invalid URL format');
        }
        break;
    }
  }

  /**
   * Ensures only one primary contact per client
   */
  private async ensureSinglePrimary(
    clientId: string,
    excludeId?: string,
  ): Promise<void> {
    const queryBuilder = this.clientContactsRepository
      .createQueryBuilder()
      .update(ClientContact)
      .set({ isPrimary: false })
      .where('clientId = :clientId', { clientId })
      .andWhere('isPrimary = :isPrimary', { isPrimary: true });

    if (excludeId) {
      queryBuilder.andWhere('id != :excludeId', { excludeId });
    }

    await queryBuilder.execute();
  }

  /**
   * Ensures only one primary phone per client
   */
  private async ensureSinglePrimaryPhone(
    clientId: string,
    excludeId?: string,
  ): Promise<void> {
    const queryBuilder = this.clientContactsRepository
      .createQueryBuilder()
      .update(ClientContact)
      .set({ isPrimaryPhone: false })
      .where('clientId = :clientId', { clientId })
      .andWhere('isPrimaryPhone = :isPrimaryPhone', { isPrimaryPhone: true });

    if (excludeId) {
      queryBuilder.andWhere('id != :excludeId', { excludeId });
    }

    await queryBuilder.execute();
  }

  /**
   * Creates a new contact for a client
   */
  async create(
    clientId: string,
    userId: string,
    createContactDto: CreateClientContactDto,
  ): Promise<ClientContact> {
    await this.validateClientOwnership(clientId, userId);

    // Validate contact value
    this.validateContact(
      createContactDto.type,
      createContactDto.value,
      createContactDto.bypassValidation,
    );

    const contact = this.clientContactsRepository.create({
      clientId,
      type: createContactDto.type,
      value: createContactDto.value,
      label: createContactDto.label,
      isPrimary: false,
      isPrimaryPhone: false,
    });

    return this.clientContactsRepository.save(contact);
  }

  /**
   * Finds all contacts for a client
   */
  async findAll(clientId: string, userId: string): Promise<ClientContact[]> {
    await this.validateClientOwnership(clientId, userId);

    return this.clientContactsRepository.find({
      where: { clientId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Finds a single contact
   */
  async findOne(
    clientId: string,
    contactId: string,
    userId: string,
  ): Promise<ClientContact> {
    await this.validateClientOwnership(clientId, userId);

    const contact = await this.clientContactsRepository.findOne({
      where: { id: contactId, clientId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  /**
   * Updates a contact
   */
  async update(
    clientId: string,
    contactId: string,
    userId: string,
    updateContactDto: UpdateClientContactDto,
  ): Promise<ClientContact> {
    const contact = await this.findOne(clientId, contactId, userId);

    // Validate if value or type is being updated
    if (updateContactDto.value || updateContactDto.type) {
      const type = updateContactDto.type ?? contact.type;
      const value = updateContactDto.value ?? contact.value;
      this.validateContact(
        type,
        value,
        updateContactDto.bypassValidation ?? false,
      );
    }

    // Update fields
    if (updateContactDto.type !== undefined) {
      contact.type = updateContactDto.type;
    }
    if (updateContactDto.value !== undefined) {
      contact.value = updateContactDto.value;
    }
    if (updateContactDto.label !== undefined) {
      contact.label = updateContactDto.label;
    }

    return this.clientContactsRepository.save(contact);
  }

  /**
   * Deletes a contact
   */
  async remove(
    clientId: string,
    contactId: string,
    userId: string,
  ): Promise<void> {
    const contact = await this.findOne(clientId, contactId, userId);
    await this.clientContactsRepository.remove(contact);
  }

  /**
   * Sets a contact as primary
   */
  async setPrimary(
    clientId: string,
    contactId: string,
    userId: string,
  ): Promise<ClientContact> {
    const contact = await this.findOne(clientId, contactId, userId);

    // Unset other primary contacts
    await this.ensureSinglePrimary(clientId, contactId);

    contact.isPrimary = true;
    return this.clientContactsRepository.save(contact);
  }

  /**
   * Sets a phone contact as primary phone
   */
  async setPrimaryPhone(
    clientId: string,
    contactId: string,
    userId: string,
  ): Promise<ClientContact> {
    const contact = await this.findOne(clientId, contactId, userId);

    if (contact.type !== ContactType.PHONE) {
      throw new BadRequestException('Only phone contacts can be set as primary phone');
    }

    // Unset other primary phones
    await this.ensureSinglePrimaryPhone(clientId, contactId);

    contact.isPrimaryPhone = true;
    return this.clientContactsRepository.save(contact);
  }
}

