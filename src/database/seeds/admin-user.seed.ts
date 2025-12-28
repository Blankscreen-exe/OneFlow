import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { join } from 'path';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { getDatabaseConfig } from '../../config/database.config';

// Get database config
const dbConfig = getDatabaseConfig() as any;

// Create data source with all entities to avoid relationship errors
const seedDataSource = new DataSource({
  type: dbConfig.type,
  url: dbConfig.url,
  database: dbConfig.database,
  entities: [join(__dirname, '..', '..', '**', '*.entity{.ts,.js}')],
  synchronize: false, // Don't sync, just use existing schema
  logging: false,
});

const adminUser = {
  email: 'admin@oneflow.com',
  password: 'admin123', // Will be hashed
  firstName: 'Super',
  lastName: 'Admin',
  role: Role.ADMIN,
};

async function seed() {
  console.log('Initializing data source...');
  await seedDataSource.initialize();

  console.log('Seeding admin user...');
  const repository = seedDataSource.getRepository(User);

  // Check if admin user already exists
  const existing = await repository.findOne({
    where: { email: adminUser.email },
  });

  if (existing) {
    console.log(`Admin user already exists: ${adminUser.email}`);
    console.log('Updating password...');
    // Update password in case it changed
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    existing.password = hashedPassword;
    existing.role = Role.ADMIN; // Ensure role is ADMIN
    await repository.save(existing);
    console.log('Admin user updated successfully!');
  } else {
    console.log(`Creating admin user: ${adminUser.email}`);
    // Hash password
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    
    const user = repository.create({
      ...adminUser,
      password: hashedPassword,
    });
    
    await repository.save(user);
    console.log('Admin user created successfully!');
  }

  console.log('\n========================================');
  console.log('Admin User Credentials:');
  console.log('Email: admin@oneflow.com');
  console.log('Password: admin123');
  console.log('========================================\n');

  console.log('Seeding complete!');
  await seedDataSource.destroy();
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});

