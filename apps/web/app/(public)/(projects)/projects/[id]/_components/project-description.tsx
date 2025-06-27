import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { LaunchProjectDialog } from '@/components/project/launch-project-dialog';
import { ClaimProjectDialog } from '@/components/project/claim-project-dialog';
import ProjectTicks from '@/components/project/project-ticks';
import { projectProviderEnum } from '@workspace/db/schema';
import { Button } from '@workspace/ui/components/button';
import Icons from '@workspace/ui/components/icons';
import Link from '@workspace/ui/components/link';
import { Globe, Linkedin } from 'lucide-react';
import Image from 'next/image';

export default function ProjectDescription({
  repo,
  project,
  user,
  isUnclaimed,
  isOwner,
}: {
  repo: any; // todo: fix type
  project: any; // todo: fix type
  user?: { id: string } | null;
  isUnclaimed: boolean;
  isOwner: boolean;
}) {
  const getAvatarImage = (): string => {
    if (repo && repo.owner && typeof repo.owner.avatar_url === 'string') {
      return repo.owner.avatar_url;
    }
    if (repo?.namespace && typeof repo.namespace.avatar_url === 'string') {
      return `https://${project.gitHost}.com${repo.namespace.avatar_url}`;
    }
    return '';
  };

  const avatarImage = getAvatarImage();

  return (
    <div className="border border-neutral-800 bg-neutral-900/50 p-4 md:p-6">
      <div className="flex flex-col gap-4">
        {/* Top row: Avatar + Title + Tags (left) */}
        <div className="flex flex-col justify-between md:flex-row">
          <div className="flex items-center gap-3">
            <ProjectAvatar
              avatarImage={avatarImage}
              projectName={project.name}
              repoOwnerName={repo?.owner.name}
              className="h-12 w-12 flex-shrink-0 rounded-full md:h-16 md:w-16"
            />
            <div className="w-full flex-1">
              <ProjectTitleAndTicks
                project={project}
                className="truncate text-lg font-bold text-white sm:text-2xl md:text-xl"
              />
              <StatusBadges project={project} />
            </div>
          </div>
          <ClaimProjectSection
            isUnclaimed={isUnclaimed}
            user={user}
            project={project}
            className="mt-4 w-full rounded-none border border-neutral-700 bg-neutral-800/30 p-2 md:mt-0 md:w-1/4"
          />
        </div>

        {/* Content: Social + Description (full width) */}
        <div className="space-y-4 md:col-span-2">
          <SocialLinks project={project} />
          <ProjectDescriptionText project={project} />
        </div>
      </div>
      {/* Action buttons (full width) */}
      <div className="flex w-full justify-end">
        <ActionButtons
          isOwner={isOwner}
          project={project}
          repo={repo}
          className="flex flex-row items-stretch gap-2"
        />
      </div>
    </div>
  );
}

function ProjectAvatar({
  avatarImage,
  projectName,
  repoOwnerName,
  className,
}: {
  avatarImage: string;
  projectName?: string;
  repoOwnerName?: string;
  className: string;
}) {
  return (
    <Avatar className={className}>
      <AvatarImage asChild src={avatarImage}>
        <Image src={avatarImage} alt={projectName ?? 'Project Logo'} width={256} height={256} />
      </AvatarImage>
      <AvatarFallback>{repoOwnerName}</AvatarFallback>
    </Avatar>
  );
}

function StatusBadges({ project }: { project: any }) {
  return (
    <div className="mt-2 flex w-full flex-row flex-wrap gap-1 md:gap-2">
      <span className="rounded-md bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-300">
        {project?.status?.displayName || project?.status?.name || 'Unknown Status'}
      </span>
      <span className="rounded-md bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-300">
        {project?.type?.displayName || project?.type?.name || 'Unknown Type'}
      </span>
      {project?.hasBeenAcquired && (
        <span className="rounded-md bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400">
          Acquired
        </span>
      )}
    </div>
  );
}

function ProjectTitleAndTicks({ project, className }: { project: any; className: string }) {
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <h1 className={className}>{project?.name}</h1>
      <ProjectTicks project={project} />
    </div>
  );
}

function SocialLinks({ project }: { project: any }) {
  if (!project?.socialLinks) return null;

  return (
    <div className="flex flex-wrap gap-3 md:gap-4">
      {project.socialLinks.website && (
        <Link
          href={project.socialLinks.website}
          target="_blank"
          event="project_page_website_link_clicked"
          eventObject={{ projectId: project.id }}
          className="flex items-center gap-1.5 text-neutral-300 transition-colors hover:text-white"
        >
          <Globe className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Website</span>
        </Link>
      )}
      {project.socialLinks.discord && (
        <Link
          href={project.socialLinks.discord}
          target="_blank"
          rel="noopener noreferrer"
          event="project_page_discord_link_clicked"
          eventObject={{ projectId: project.id }}
          className="flex items-center gap-1.5 text-neutral-300 transition-colors hover:text-white"
        >
          <Icons.discord className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Discord</span>
        </Link>
      )}
      {project.socialLinks.twitter && (
        <Link
          href={project.socialLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          event="project_page_twitter_link_clicked"
          eventObject={{ projectId: project.id }}
          className="flex items-center gap-1.5 text-neutral-300 transition-colors hover:text-white"
        >
          <Icons.twitter className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Twitter</span>
        </Link>
      )}
      {project.socialLinks.linkedin && (
        <Link
          href={project.socialLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          event="project_page_linkedin_link_clicked"
          eventObject={{ projectId: project.id }}
          className="flex items-center gap-1.5 text-neutral-300 transition-colors hover:text-white"
        >
          <Linkedin className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">LinkedIn</span>
        </Link>
      )}
    </div>
  );
}

function ProjectDescriptionText({ project }: { project: any }) {
  // TODO; Handle long descriptions properly, either by not allowing them or truncating with a "read more" option
  return (
    <p className="line-clamp-3 text-sm leading-relaxed break-words text-neutral-400 md:mb-6 md:text-base">
      {project?.description}
    </p>
  );
}

function ClaimProjectSection({
  isUnclaimed,
  user,
  project,
  className,
}: {
  isUnclaimed: boolean;
  user?: { id: string } | null;
  project: any;
  className: string;
}) {
  if (!isUnclaimed || !user) return null;

  return (
    <div className={className}>
      <div className="flex flex-col items-center justify-center gap-2">
        <p className="text-center text-xs font-medium text-neutral-200">Unclaimed</p>
        <p className="text-center text-xs text-neutral-400 sm:w-30">
          This project hasn&apos;t been claimed yet
        </p>
        <ClaimProjectDialog
          projectId={project.id}
          provider={project.gitHost as (typeof projectProviderEnum.enumValues)[number]}
        />
      </div>
    </div>
  );
}

function ActionButtons({
  isOwner,
  project,
  repo,
  className,
}: {
  isOwner: boolean;
  project: any;
  repo: any;
  className: string;
}) {
  return (
    <div className={className}>
      {isOwner && <LaunchProjectDialog projectId={project.id} projectName={project.name} />}
      <Link
        href={project.gitHost === 'github' ? repo?.html_url : repo?.web_url}
        target="_blank"
        event="project_page_github_link_clicked"
        eventObject={{ projectId: project.id }}
      >
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-none border-neutral-700 bg-neutral-800 hover:border-neutral-600"
        >
          {project.gitHost === 'github' ? (
            <>
              <Icons.github className="h-4 w-4" />
              View on GitHub
            </>
          ) : (
            <>
              <Icons.gitlab className="h-4 w-4" />
              View on GitLab
            </>
          )}
        </Button>
      </Link>
    </div>
  );
}
