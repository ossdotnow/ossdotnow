import { projectLaunch, project } from '../schema';
import { db } from '..';

// Helper function to get start and end dates of a week (matching frontend logic)
function getWeekDates(year: number, week: number): { start: Date; end: Date } {
  // Create January 1st of the given year
  const jan1 = new Date(Date.UTC(year, 0, 1));

  // Find the first Monday of the year (or Jan 1 if it's a Monday)
  const jan1Day = jan1.getUTCDay();
  const daysToFirstMonday = jan1Day === 0 ? 1 : 8 - jan1Day;
  const firstMonday = new Date(Date.UTC(year, 0, 1 + daysToFirstMonday));

  // If Jan 1 is Monday, Tuesday, Wednesday, or Thursday, week 1 starts on Jan 1's Monday
  // Otherwise, week 1 starts on the first Monday of the year
  let weekOneStart;
  if (jan1Day >= 1 && jan1Day <= 4) {
    // Jan 1 is Mon-Thu, so week 1 includes Jan 1
    weekOneStart = new Date(Date.UTC(year, 0, 1 - (jan1Day - 1)));
  } else {
    // Jan 1 is Fri-Sun, so week 1 starts on the first Monday
    weekOneStart = firstMonday;
  }

  // Calculate the start of the requested week
  const weekStart = new Date(weekOneStart.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  // Set to local timezone
  const start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  const end = new Date(
    weekEnd.getFullYear(),
    weekEnd.getMonth(),
    weekEnd.getDate(),
    23,
    59,
    59,
    999,
  );

  return { start, end };
}

// Helper function to get a random date within a specific week
function getRandomDateInWeek(year: number, week: number): Date {
  const { start: weekStart } = getWeekDates(year, week);

  // Get random day within the week (0-6 days from Monday)
  const randomDayOffset = Math.floor(Math.random() * 7);
  const randomDate = new Date(weekStart);
  randomDate.setDate(weekStart.getDate() + randomDayOffset);

  // Set random time between 9 AM and 6 PM
  const randomHour = 9 + Math.floor(Math.random() * 9);
  const randomMinute = Math.floor(Math.random() * 60);
  randomDate.setHours(randomHour, randomMinute, 0, 0);

  return randomDate;
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Sample taglines and descriptions for launches
const launchData = [
  {
    tagline: 'Revolutionary code editor with AI-powered assistance',
    detailedDescription:
      'Experience the future of coding with our AI-powered editor that understands your code and helps you write better, faster.',
  },
  {
    tagline: 'The fastest way to build modern web applications',
    detailedDescription:
      'A comprehensive framework that combines the best of React, TypeScript, and modern tooling for rapid development.',
  },
  {
    tagline: 'Open-source analytics platform for developers',
    detailedDescription:
      "Privacy-first analytics that gives you insights without compromising your users' data. Built by developers, for developers.",
  },
  {
    tagline: 'Collaborative design tool for remote teams',
    detailedDescription:
      'Bridge the gap between design and development with real-time collaboration features and developer-friendly exports.',
  },
  {
    tagline: 'Next-generation database for modern applications',
    detailedDescription:
      'Serverless, edge-optimized database that scales automatically and provides lightning-fast queries worldwide.',
  },
  {
    tagline: 'AI-powered code review and optimization',
    detailedDescription:
      'Automatically review your code for bugs, security issues, and performance optimizations using advanced AI models.',
  },
  {
    tagline: 'The ultimate developer productivity suite',
    detailedDescription:
      'All-in-one workspace combining project management, code editing, and team collaboration in a single platform.',
  },
  {
    tagline: 'Serverless deployment made simple',
    detailedDescription:
      'Deploy your applications to the edge with zero configuration. Automatic scaling, global CDN, and built-in monitoring.',
  },
  {
    tagline: 'Open-source monitoring for cloud applications',
    detailedDescription:
      'Comprehensive observability platform with distributed tracing, metrics, and logs in a single, unified interface.',
  },
  {
    tagline: 'Real-time collaboration for developers',
    detailedDescription:
      'Code together in real-time with voice chat, screen sharing, and synchronized development environments.',
  },
];

async function seedLaunches() {
  console.log('🚀 Seeding launches...');

  try {
    // Get all existing projects
    const projects = await db.select().from(project).limit(50);

    if (projects.length === 0) {
      console.log('⚠️  No projects found. Please seed projects first.');
      process.exit(0);
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);

    // Clear existing launches and reseed
    console.log('🗑️  Clearing existing launches...');
    await db.delete(projectLaunch);
    console.log('✅ Existing launches cleared');

    const launchesToInsert = [];
    let launchDataIndex = 0;

    // Helper to get next launch data
    const getNextLaunchData = () => {
      const data = launchData[launchDataIndex % launchData.length];
      launchDataIndex++;
      return data;
    };

    // Today's launches (2-3 launches)
    const todayLaunchCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < todayLaunchCount && i < projects.length; i++) {
      const projectData = projects[i];
      const launchInfo = getNextLaunchData();
      const todayDate = new Date();
      todayDate.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0, 0);

      if (projectData && launchInfo) {
        launchesToInsert.push({
          projectId: projectData.id,
          tagline: launchInfo.tagline,
          detailedDescription: launchInfo.detailedDescription,
          launchDate: todayDate,
          status: 'live' as const,
          featured: Math.random() > 0.7,
        });
      }
    }

    // Yesterday's launches (3-4 launches)
    const yesterdayLaunchCount = 3 + Math.floor(Math.random() * 2);
    for (
      let i = todayLaunchCount;
      i < todayLaunchCount + yesterdayLaunchCount && i < projects.length;
      i++
    ) {
      const projectData = projects[i];
      const launchInfo = getNextLaunchData();
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      yesterdayDate.setHours(
        9 + Math.floor(Math.random() * 9),
        Math.floor(Math.random() * 60),
        0,
        0,
      );

      if (projectData && launchInfo) {
        launchesToInsert.push({
          projectId: projectData.id,
          tagline: launchInfo.tagline,
          detailedDescription: launchInfo.detailedDescription,
          launchDate: yesterdayDate,
          status: 'live' as const,
          featured: Math.random() > 0.8,
        });
      }
    }

    // This week's other days (excluding today and yesterday) - 4-6 launches
    const thisWeekLaunchCount = 4 + Math.floor(Math.random() * 3);
    let projectIndex = todayLaunchCount + yesterdayLaunchCount;

    for (let i = 0; i < thisWeekLaunchCount && projectIndex < projects.length; i++) {
      const projectData = projects[projectIndex];
      const launchInfo = getNextLaunchData();

      // Get a random date this week (excluding today and yesterday)
      let launchDate;
      do {
        launchDate = getRandomDateInWeek(currentYear, currentWeek);
      } while (
        launchDate.toDateString() === now.toDateString() ||
        launchDate.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString()
      );

      if (projectData && launchInfo) {
        launchesToInsert.push({
          projectId: projectData.id,
          tagline: launchInfo.tagline,
          detailedDescription: launchInfo.detailedDescription,
          launchDate: launchDate,
          status: 'live' as const,
          featured: Math.random() > 0.75,
        });
      }

      projectIndex++;
    }

    // Previous weeks' launches (8 weeks back, 4-7 launches per week)
    projectIndex = todayLaunchCount + yesterdayLaunchCount + thisWeekLaunchCount;
    const weeksToSeed = 8;

    for (let weekOffset = 1; weekOffset <= weeksToSeed; weekOffset++) {
      const targetWeek = currentWeek - weekOffset;
      if (targetWeek < 1) continue;

      const weekLaunchCount = 4 + Math.floor(Math.random() * 4); // 4-7 launches per week

      for (let i = 0; i < weekLaunchCount && projectIndex < projects.length; i++) {
        const projectData = projects[projectIndex];
        const launchInfo = getNextLaunchData();
        const launchDate = getRandomDateInWeek(currentYear, targetWeek);

        if (projectData && launchInfo) {
          launchesToInsert.push({
            projectId: projectData.id,
            tagline: launchInfo.tagline,
            detailedDescription: launchInfo.detailedDescription,
            launchDate: launchDate,
            status: 'live' as const,
            featured: Math.random() > 0.85,
          });
        }

        projectIndex++;
      }
    }

    // Insert all launches
    if (launchesToInsert.length > 0) {
      await db.insert(projectLaunch).values(launchesToInsert);
      console.log(`✅ Seeded ${launchesToInsert.length} launches successfully!`);
      console.log(`   - Today: ${todayLaunchCount} launches`);
      console.log(`   - Yesterday: ${yesterdayLaunchCount} launches`);
      console.log(`   - This week (other days): ${thisWeekLaunchCount} launches`);
      console.log(
        `   - Previous ${weeksToSeed} weeks: ${launchesToInsert.length - todayLaunchCount - yesterdayLaunchCount - thisWeekLaunchCount} launches`,
      );
    } else {
      console.log('⚠️  No launches to insert');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding launches:', error);
    process.exit(1);
  }
}

seedLaunches().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
