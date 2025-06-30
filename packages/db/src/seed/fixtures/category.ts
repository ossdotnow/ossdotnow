import { categoryTags, categoryProjectTypes, categoryProjectStatuses } from '../../schema';
import { fixture } from '../create-fixture';

export const categoryTagsData = fixture(categoryTags).data([
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
]);

export const categoryProjectTypesData = fixture(categoryProjectTypes).data([
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
]);

export const categoryProjectStatusesData = fixture(categoryProjectStatuses).data([
  {
    name: 'active',
    displayName: 'Active',
    isActive: true,
    sortOrder: 10,
  },
  {
    name: 'inactive',
    displayName: 'Inactive',
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
]);
