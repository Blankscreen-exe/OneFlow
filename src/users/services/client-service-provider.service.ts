import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientServiceProvider } from '../entities/client-service-provider.entity';
import { User } from '../entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class ClientServiceProviderService {
  constructor(
    @InjectRepository(ClientServiceProvider)
    private clientServiceProviderRepository: Repository<ClientServiceProvider>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Link a client to a service provider
   */
  async linkClientToServiceProvider(
    clientId: string,
    serviceProviderId: string,
  ): Promise<ClientServiceProvider> {
    // Validate client exists and has CLIENT role
    const client = await this.usersRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.role !== Role.CLIENT) {
      throw new BadRequestException('User is not a client');
    }

    // Validate service provider exists and has SERVICE_PROVIDER role
    const serviceProvider = await this.usersRepository.findOne({
      where: { id: serviceProviderId },
    });

    if (!serviceProvider) {
      throw new NotFoundException('Service provider not found');
    }

    if (serviceProvider.role !== Role.SERVICE_PROVIDER) {
      throw new BadRequestException('User is not a service provider');
    }

    // Check if relationship already exists
    const existing = await this.clientServiceProviderRepository.findOne({
      where: {
        clientId,
        serviceProviderId,
      },
    });

    if (existing) {
      throw new ConflictException('Client is already linked to this service provider');
    }

    // Create relationship
    const relationship = this.clientServiceProviderRepository.create({
      clientId,
      serviceProviderId,
    });

    return this.clientServiceProviderRepository.save(relationship);
  }

  /**
   * Get all service providers for a client
   */
  async getServiceProvidersForClient(clientId: string): Promise<User[]> {
    const relationships = await this.clientServiceProviderRepository.find({
      where: { clientId },
      relations: ['serviceProvider'],
    });

    return relationships.map((rel) => rel.serviceProvider);
  }

  /**
   * Get all clients for a service provider
   */
  async getClientsForServiceProvider(serviceProviderId: string): Promise<User[]> {
    const relationships = await this.clientServiceProviderRepository.find({
      where: { serviceProviderId },
      relations: ['client'],
    });

    return relationships.map((rel) => rel.client);
  }

  /**
   * Remove relationship between client and service provider
   */
  async removeRelationship(
    clientId: string,
    serviceProviderId: string,
  ): Promise<void> {
    const relationship = await this.clientServiceProviderRepository.findOne({
      where: {
        clientId,
        serviceProviderId,
      },
    });

    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }

    await this.clientServiceProviderRepository.remove(relationship);
  }

  /**
   * Check if client is linked to service provider
   */
  async isClientLinkedToSP(
    clientId: string,
    serviceProviderId: string,
  ): Promise<boolean> {
    const relationship = await this.clientServiceProviderRepository.findOne({
      where: {
        clientId,
        serviceProviderId,
      },
    });

    return !!relationship;
  }
}

