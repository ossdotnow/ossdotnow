import Icons from '@workspace/ui/components/icons';

export const providers = [
  {
    name: 'Github',
    icon: Icons.github,
    providerId: 'github' as const,
  },
  {
    name: 'Gitlab',
    icon: Icons.gitlab,
    providerId: 'gitlab' as const,
  },
];

export type ProviderId = (typeof providers)[number]['providerId'];
