// DO NOT COMMIT THIS FILE. DELETE AFTER USE.
// This script sets all users' role to 'admin'.
import { db } from '..';
import { user } from '../schema/auth';

async function makeAllAdmins() {
  console.log('🚨 Setting all users to admin...');
  const result = await db.update(user).set({ role: 'admin' });
  // result.rowCount is available in some drivers, fallback to logging result
  console.log('✅ All users set to admin. Result:', result);
  process.exit(0);
}

makeAllAdmins().catch((error) => {
  process.exit(1);
})
