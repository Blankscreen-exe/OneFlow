import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientSource } from './entities/client-source.entity';
import { ClientSourcesService } from './client-sources.service';
import { ClientSourcesController } from './client-sources.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientSource])],
  controllers: [ClientSourcesController],
  providers: [ClientSourcesService],
  exports: [TypeOrmModule, ClientSourcesService],
})
export class ClientSourcesModule {}
