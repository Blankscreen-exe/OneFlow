import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientContact } from './entities/client-contact.entity';
import { Client } from '../clients/entities/client.entity';
import { ClientContactsService } from './client-contacts.service';
import { ClientContactsController } from './client-contacts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientContact, Client])],
  controllers: [ClientContactsController],
  providers: [ClientContactsService],
  exports: [ClientContactsService],
})
export class ClientContactsModule {}

