import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { ClientPortalController } from './client-portal.controller';
import { ClientPortalService } from './services/client-portal.service';
import { Client } from './entities/client.entity';
import { ClientSource } from '../client-sources/entities/client-source.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Proposal } from '../proposals/entities/proposal.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientSource, Invoice, Proposal]),
    UsersModule,
  ],
  controllers: [ClientsController, ClientPortalController],
  providers: [ClientsService, ClientPortalService],
  exports: [ClientsService],
})
export class ClientsModule {}
