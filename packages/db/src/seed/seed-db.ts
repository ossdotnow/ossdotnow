import * as fixtures from './fixtures';
import { db } from '..';

export async function seedDb() {
  console.log('🌱 Seeding database...');

  for (const fixtureName of Object.keys(fixtures)) {
    const fixture = fixtures[fixtureName as keyof typeof fixtures];
    if ('run' in fixture && typeof fixture.run === 'function') {
      await fixture.run(db);
      console.log(`✅ Seeded fixture: ${fixtureName}`);
    } else {
      console.warn(
        `Skipping fixture ${fixtureName} as it may not be properly defined. Make sure to use fixture() to create fixtures.`,
      );
    }
  }

  console.log('✅ Database seeded successfully!');
  process.exit(0);
}

seedDb().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
