import { categoryTags, categoryProjectTypes, categoryProjectStatuses } from '../../schema';
import { fixture } from '../create-fixture';
import { DB } from '../..';

// Raw data arrays
export const categoryTagsRawData = [
  {
    name: 'web',
    displayName: 'Web Development',
    isActive: true,
    sortOrder: 10,
  },
  {
    name: 'mobile',
    displayName: 'Mobile Apps',
    isActive: true,
    sortOrder: 20,
  },
  {
    name: 'ai',
    displayName: 'Artificial Intelligence',
    isActive: true,
    sortOrder: 30,
  },
  {
    name: 'devtools',
    displayName: 'Developer Tools',
    isActive: true,
    sortOrder: 40,
  },
  {
    name: 'cloud',
    displayName: 'Cloud Services',
    isActive: true,
    sortOrder: 50,
  },
  {
    name: 'desktop',
    displayName: 'Desktop Applications',
    isActive: true,
    sortOrder: 60,
  },
  {
    name: 'backend',
    displayName: 'Backend Development',
    isActive: true,
    sortOrder: 70,
  },
  {
    name: 'frontend',
    displayName: 'Frontend Development',
    isActive: true,
    sortOrder: 80,
  },
  {
    name: 'fullstack',
    displayName: 'Full Stack',
    isActive: true,
    sortOrder: 90,
  },
  {
    name: 'game',
    displayName: 'Game Development',
    isActive: true,
    sortOrder: 100,
  },
  {
    name: 'crypto',
    displayName: 'Cryptocurrency',
    isActive: true,
    sortOrder: 110,
  },
  {
    name: 'nft',
    displayName: 'NFT',
    isActive: true,
    sortOrder: 120,
  },
  {
    name: 'social',
    displayName: 'Social Media',
    isActive: true,
    sortOrder: 130,
  },
  {
    name: 'other',
    displayName: 'Other',
    isActive: true,
    sortOrder: 140,
  },
  {
    name: 'dapp',
    displayName: 'DApps',
    isActive: true,
    sortOrder: 150,
  },
  {
    name: 'saas',
    displayName: 'SaaS',
    isActive: true,
    sortOrder: 160,
  },
  {
    name: 'algorithm',
    displayName: 'Algorithms',
    isActive: true,
    sortOrder: 170,
  },
  {
    name: 'data-analysis',
    displayName: 'Data Analysis',
    isActive: true,
    sortOrder: 180,
  },
  {
    name: 'game-engine',
    displayName: 'Game Engines',
    isActive: true,
    sortOrder: 190,
  },
];

export const categoryProjectTypesRawData = [
  {
    name: 'fintech',
    displayName: 'Financial Technology',
    isActive: true,
    sortOrder: 10,
  },
  {
    name: 'healthtech',
    displayName: 'Health Technology',
    isActive: true,
    sortOrder: 20,
  },
  {
    name: 'edtech',
    displayName: 'Education Technology',
    isActive: true,
    sortOrder: 30,
  },
  {
    name: 'ecommerce',
    displayName: 'E-Commerce',
    isActive: true,
    sortOrder: 40,
  },
  {
    name: 'productivity',
    displayName: 'Productivity',
    isActive: true,
    sortOrder: 50,
  },
  {
    name: 'social',
    displayName: 'Social',
    isActive: true,
    sortOrder: 60,
  },
  {
    name: 'entertainment',
    displayName: 'Entertainment',
    isActive: true,
    sortOrder: 70,
  },
  {
    name: 'developer-tools',
    displayName: 'Developer Tools',
    isActive: true,
    sortOrder: 80,
  },
  {
    name: 'content-management',
    displayName: 'Content Management',
    isActive: true,
    sortOrder: 90,
  },
  {
    name: 'analytics',
    displayName: 'Analytics',
    isActive: true,
    sortOrder: 100,
  },
  {
    name: 'other',
    displayName: 'Other',
    isActive: true,
    sortOrder: 110,
  },
];

export const categoryProjectStatusesRawData = [
  {
    name: 'active',
    displayName: 'Active - Currently being developed',
    isActive: true,
    sortOrder: 10,
  },
  {
    name: 'inactive',
    displayName: 'Inactive - Not currently maintained',
    isActive: true,
    sortOrder: 20,
  },
  {
    name: 'archived',
    displayName: 'Archived',
    isActive: true,
    sortOrder: 30,
  },
  {
    name: 'featured',
    displayName: 'Featured',
    isActive: true,
    sortOrder: 40,
  },
  {
    name: 'early-stage',
    displayName: 'Early Stage - Just getting started',
    isActive: true,
    sortOrder: 50,
  },
  {
    name: 'beta',
    displayName: 'Beta - Testing with limited users',
    isActive: true,
    sortOrder: 60,
  },
  {
    name: 'production-ready',
    displayName: 'Production Ready - Stable for use',
    isActive: true,
    sortOrder: 70,
  },
  {
    name: 'experimental',
    displayName: 'Experimental - Proof of concept',
    isActive: true,
    sortOrder: 80,
  },
  {
    name: 'cancelled',
    displayName: 'Cancelled - No longer pursuing',
    isActive: true,
    sortOrder: 90,
  },
  {
    name: 'paused',
    displayName: 'Paused - Temporarily on hold',
    isActive: true,
    sortOrder: 100,
  },
];

// Fixtures
export const categoryTagsData = {
  async run(db: DB) {
    const existing = await db.select().from(categoryTags);
    if (existing.length === 0) {
      await db.insert(categoryTags).values(categoryTagsRawData);
      console.log(`✅ Seeded category_tags with ${categoryTagsRawData.length} records`);
    } else {
      console.log(`⏭️  Skipping category_tags - already seeded`);
    }
  },
};
export const categoryProjectTypesData = fixture(categoryProjectTypes).data(
  categoryProjectTypesRawData,
);
export const categoryProjectStatusesData = fixture(categoryProjectStatuses).data(
  categoryProjectStatusesRawData,
);
