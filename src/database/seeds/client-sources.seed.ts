import { DataSource } from 'typeorm';
import { ClientSource } from '../../client-sources/entities/client-source.entity';
import { getDatabaseConfig } from '../../config/database.config';
import { join } from 'path';

// Create a minimal data source just for the ClientSource entity
const seedDataSource = new DataSource({
  ...(getDatabaseConfig() as any),
  entities: [ClientSource],
  synchronize: true, // Only syncs ClientSource entity
});

const clientSources = [
  {
    slug: 'local',
    name: 'Local',
    description: 'Local/direct client',
  },
  {
    slug: 'upwork',
    name: 'Upwork',
    description: 'Client from Upwork platform',
  },
  {
    slug: 'freelancer',
    name: 'Freelancer',
    description: 'Client from Freelancer.com',
  },
  {
    slug: 'guru',
    name: 'Guru',
    description: 'Client from Guru.com',
  },
  {
    slug: 'linkedin',
    name: 'LinkedIn',
    description: 'Client from LinkedIn',
  },
  {
    slug: 'fiverr',
    name: 'Fiverr',
    description: 'Client from Fiverr',
  },
  {
    slug: 'referral',
    name: 'Referral',
    description: 'Referred by existing client',
  },
  {
    slug: 'website',
    name: 'Website',
    description: 'Client from website inquiry',
  },
  {
    slug: 'social_media',
    name: 'Social Media',
    description: 'Client from social media',
  },
  {
    slug: 'cold_outreach',
    name: 'Cold Outreach',
    description: 'Client from cold outreach',
  },
  {
    slug: 'other',
    name: 'Other',
    description: 'Other/unspecified source',
  },
];

async function seed() {
  console.log('Initializing data source...');
  await seedDataSource.initialize();

  console.log('Seeding client sources...');
  const repository = seedDataSource.getRepository(ClientSource);

  for (const source of clientSources) {
    const existing = await repository.findOne({
      where: { slug: source.slug },
    });

    if (!existing) {
      await repository.save(repository.create(source));
      console.log(`Created source: ${source.name}`);
    } else {
      console.log(`Source already exists: ${source.name}`);
    }
  }

  console.log('Seeding complete!');
  await seedDataSource.destroy();
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
