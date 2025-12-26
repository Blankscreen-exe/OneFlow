import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';
import { ClientServiceProvider } from './client-service-provider.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({
    type: 'simple-enum',
    enum: Role,
    default: Role.SERVICE_PROVIDER,
  })
  role: Role;

  // Relationships for clients (when user is a client)
  @OneToMany(() => ClientServiceProvider, (csp) => csp.client)
  clientRelationships: Relation<ClientServiceProvider[]>;

  // Relationships for service providers (when user is a service provider)
  @OneToMany(() => ClientServiceProvider, (csp) => csp.serviceProvider)
  serviceProviderRelationships: Relation<ClientServiceProvider[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

