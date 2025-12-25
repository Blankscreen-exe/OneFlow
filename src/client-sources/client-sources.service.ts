import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientSource } from './entities/client-source.entity';

@Injectable()
export class ClientSourcesService {
  constructor(
    @InjectRepository(ClientSource)
    private clientSourcesRepository: Repository<ClientSource>,
  ) {}

  async findAll(): Promise<ClientSource[]> {
    return this.clientSourcesRepository.find({
      order: { name: 'ASC' },
    });
  }
}


