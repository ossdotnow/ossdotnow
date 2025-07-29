#!/usr/bin/env bun
/**
 * Migration script to update existing launches with proper status
 * Run this after applying the database migration
 */

import { projectLaunch } from '../src/schema';
import { eq, lte } from 'drizzle-orm';
import { db } from '../src/index';

async function updateLaunchStatuses() {
  try {
    const now = new Date();

    // Update launches that should be live (launch date has passed)
    const liveUpdates = await db
      .update(projectLaunch)
      .set({ status: 'live' })
      .where(lte(projectLaunch.launchDate, now))
      .returning({ id: projectLaunch.id, launchDate: projectLaunch.launchDate });

    // Count remaining scheduled launches
    const scheduledCount = await db
      .select({ count: projectLaunch.id })
      .from(projectLaunch)
      .where(eq(projectLaunch.status, 'scheduled'));

    return {
      liveUpdates: liveUpdates.length,
      scheduledRemaining: scheduledCount.length,
    };
  } catch (error) {
    throw error;
  }
}

// Run the migration
updateLaunchStatuses()
  .then((result) => {
    console.log(
      `Migration completed: ${result.liveUpdates} launches activated, ${result.scheduledRemaining} remain scheduled`,
    );
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
