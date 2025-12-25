import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { ClientSource } from '../client-sources/entities/client-source.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientQueryDto } from './dto/client-query.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    @InjectRepository(ClientSource)
    private clientSourcesRepository: Repository<ClientSource>,
  ) {}

  private async validateSourceExists(sourceId: string): Promise<void> {
    const source = await this.clientSourcesRepository.findOne({
      where: { id: sourceId },
    });
    if (!source) {
      throw new BadRequestException('Invalid source ID');
    }
  }

  async create(
    userId: string,
    createClientDto: CreateClientDto,
  ): Promise<Client> {
    // Validate source exists
    await this.validateSourceExists(createClientDto.sourceId);

    // Check email uniqueness for this user if email is provided
    if (createClientDto.email) {
      const existingClient = await this.clientsRepository.findOne({
        where: {
          userId,
          email: createClientDto.email,
        },
      });

      if (existingClient) {
        throw new ConflictException(
          'A client with this email already exists for your account',
        );
      }
    }

    const client = this.clientsRepository.create({
      ...createClientDto,
      userId,
    });

    return this.clientsRepository.save(client);
  }

  async findAll(
    userId: string,
    query: ClientQueryDto,
  ): Promise<PaginatedResult<Client>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';
    const { search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.clientsRepository
      .createQueryBuilder('client')
      .where('client.userId = :userId', { userId });

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(client.name ILIKE :search OR client.email ILIKE :search OR client.company ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`client.${sortBy}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const data = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id, userId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(
    id: string,
    userId: string,
    updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    const client = await this.findOne(id, userId);

    // Validate source exists if being updated
    if (updateClientDto.sourceId) {
      await this.validateSourceExists(updateClientDto.sourceId);
    }

    // Check email uniqueness if email is being updated
    if (updateClientDto.email && updateClientDto.email !== client.email) {
      const existingClient = await this.clientsRepository.findOne({
        where: {
          userId,
          email: updateClientDto.email,
        },
      });

      if (existingClient && existingClient.id !== id) {
        throw new ConflictException(
          'A client with this email already exists for your account',
        );
      }
    }

    Object.assign(client, updateClientDto);
    return this.clientsRepository.save(client);
  }

  async remove(id: string, userId: string): Promise<void> {
    const client = await this.findOne(id, userId);
    await this.clientsRepository.remove(client);
  }
}

