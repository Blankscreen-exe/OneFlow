import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { ClientServiceProvider } from './entities/client-service-provider.entity';
import { ClientServiceProviderService } from './services/client-service-provider.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, ClientServiceProvider])],
  controllers: [UsersController],
  providers: [UsersService, ClientServiceProviderService],
  exports: [UsersService, ClientServiceProviderService],
})
export class UsersModule {}

