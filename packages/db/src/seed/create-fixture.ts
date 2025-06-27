import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { getTableName } from 'drizzle-orm';
import { type DB } from '..';

/**
 * Provides a type-safe way to create a fixture for a table.
 */
export function fixture<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TTable extends PgTableWithColumns<any>, // this type isn't ideal but it doesn't really matter
>(table: TTable) {
  return {
    data(data: TTable['$inferInsert'][]) {
      return {
        async run(db: DB) {
          const tableName = getTableName(table);
          // this is very simplified, ideally this would run in a transaction
          // however for proper seeding we should use drizzle migrations
          try {
            await db.insert(table).values(data);
            console.log(`✅ Seeded ${tableName} with ${data.length} records`);
          } catch (error) {
            console.error(`❌ Error seeding fixture ${tableName}:`, error);
          }
        },
      };
    },
  };
}
