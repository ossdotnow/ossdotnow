export type Project = {
  id: string;
  name: string;
  description: string | null;
  gitRepoUrl: string;
  gitHost: string;
  logoUrl: string | null;
  approvalStatus: string;
  status: { name: string } | null;
  type: { name: string } | null;
  tagRelations: Array<{ tag: { name: string } | null }>;
  socialLinks: {
    twitter: string | null;
    discord: string | null;
    linkedin: string | null;
    website: string | null;
  } | null;
  isLookingForContributors: boolean;
  isLookingForInvestors: boolean;
  isHiring: boolean;
  isPublic: boolean;
  hasBeenAcquired: boolean;
  isPinned: boolean;
  isRepoPrivate: boolean;
};

// Type guard function to verify that data conforms to Project type
export function isProject(data: unknown): data is Project {
  if (!data || typeof data !== 'object') return false;

  const project = data as Record<string, unknown>;

  return (
    typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    (project.description === null || typeof project.description === 'string') &&
    typeof project.gitRepoUrl === 'string' &&
    typeof project.gitHost === 'string' &&
    (project.logoUrl === null || typeof project.logoUrl === 'string') &&
    typeof project.approvalStatus === 'string' &&
    (project.status === null || (typeof project.status === 'object' && project.status !== null && typeof (project.status as Record<string, unknown>).name === 'string')) &&
    (project.type === null || (typeof project.type === 'object' && project.type !== null && typeof (project.type as Record<string, unknown>).name === 'string')) &&
    Array.isArray(project.tagRelations) &&
    project.tagRelations.every(relation =>
      relation &&
      typeof relation === 'object' &&
      (relation.tag === null ||
        (typeof relation.tag === 'object' &&
         relation.tag !== null &&
         typeof relation.tag.name === 'string'))
    ) &&
    (project.socialLinks === null || (
      typeof project.socialLinks === 'object' &&
      project.socialLinks !== null &&
      ['twitter', 'discord', 'linkedin', 'website'].every(key =>
        project.socialLinks![key as keyof typeof project.socialLinks] === null ||
        typeof project.socialLinks![key as keyof typeof project.socialLinks] === 'string'
      )
    )) &&
    typeof project.isLookingForContributors === 'boolean' &&
    typeof project.isLookingForInvestors === 'boolean' &&
    typeof project.isHiring === 'boolean' &&
    typeof project.isPublic === 'boolean' &&
    typeof project.hasBeenAcquired === 'boolean' &&
    typeof project.isPinned === 'boolean' &&
    typeof project.isRepoPrivate === 'boolean'
  );
}
