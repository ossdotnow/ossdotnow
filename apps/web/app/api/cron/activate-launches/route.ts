import { NextRequest, NextResponse } from 'next/server';
import { projectLaunch } from '@workspace/db/schema';
import { and, eq, lte } from 'drizzle-orm';
import { db } from '@workspace/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const result = await db
      .update(projectLaunch)
      .set({
        status: 'live',
        updatedAt: now,
      })
      .where(and(eq(projectLaunch.status, 'scheduled'), lte(projectLaunch.launchDate, now)))
      .returning({
        id: projectLaunch.id,
        projectId: projectLaunch.projectId,
        launchDate: projectLaunch.launchDate,
      });

    const activatedCount = result.length;

    return NextResponse.json({
      success: true,
      activated: activatedCount,
      timestamp: now.toISOString(),
      launches: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
