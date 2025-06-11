import { project as projectSchema } from '@workspace/db/schema';
import { faker } from '@faker-js/faker';

const getRandomEnumValue = <T extends Record<string, unknown>>(enumObj: T): T[keyof T] => {
  const enumValues = Object.values(enumObj);
  return enumValues[Math.floor(Math.random() * enumValues.length)] as T[keyof T];
};

const PROJECT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EARLY_STAGE: 'early-stage',
  BETA: 'beta',
  PRODUCTION_READY: 'production-ready',
  EXPERIMENTAL: 'experimental',
  CANCELLED: 'cancelled',
  PAUSED: 'paused',
} as const;

const PROJECT_TYPE = {
  FINTECH: 'fintech',
  HEALTHTECH: 'healthtech',
  EDTECH: 'edtech',
  ECOMMERCE: 'ecommerce',
  PRODUCTIVITY: 'productivity',
  SOCIAL: 'social',
  ENTERTAINMENT: 'entertainment',
  DEVELOPER_TOOLS: 'developer-tools',
  CONTENT_MANAGEMENT: 'content-management',
  ANALYTICS: 'analytics',
  OTHER: 'other',
} as const;

const generateFakeProject = (): Partial<typeof projectSchema.$inferSelect> => {
  const hasBeenAcquired = faker.datatype.boolean();

  return {
    id: faker.string.uuid(),
    ownerId: faker.string.uuid(),
    logoUrl: faker.image.urlPicsumPhotos({ width: 100, height: 100 }),
    gitRepoUrl: `https://github.com/${faker.internet.username()}/${faker.helpers.slugify(faker.company.name())}`,
    gitHost: 'github',
    name: faker.company.name(),
    description: faker.company.catchPhrase(),
    socialLinks: {
      twitter: `https://twitter.com/${faker.internet.username()}`,
      github: `https://github.com/${faker.internet.username()}`,
      linkedin: `https://linkedin.com/company/${faker.helpers.slugify(faker.company.name())}`,
      website: faker.internet.url(),
    },
    tags: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
      faker.helpers.arrayElement([
        'web',
        'mobile',
        'desktop',
        'backend',
        'frontend',
        'fullstack',
        'ai',
        'game',
        'crypto',
        'nft',
        'social',
        'other',
      ]),
    ),
    status: getRandomEnumValue(PROJECT_STATUS),
    type: getRandomEnumValue(PROJECT_TYPE),
    isLookingForContributors: faker.datatype.boolean(),
    isLookingForInvestors: faker.datatype.boolean(),
    isHiring: faker.datatype.boolean(),
    isPublic: faker.datatype.boolean(),
    hasBeenAcquired,
    acquiredBy: hasBeenAcquired ? faker.string.uuid() : null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    deletedAt: null,
  };
};

export const projects = Array.from({ length: 40 }, generateFakeProject);
export const project = {
  ...projects[0],
  description: faker.lorem.paragraphs(3),
  hasBeenAcquired: true,
  acquiredBy: faker.string.uuid(),
  isHiring: true,
  isLookingForContributors: true,
  isLookingForInvestors: true,
  isPublic: true,
  socialLinks: {
    twitter: 'https://twitter.com/example',
    github: 'https://github.com/example',
    linkedin: 'https://linkedin.com/company/example',
    website: 'https://example.com',
  },
};
