import Icons from '@/components/icons';

export const providers = [
  {
    name: 'Github',
    icon: Icons.github,
    providerId: 'github' as const,
  },
];

export type ProviderId = (typeof providers)[number]['providerId'];
