import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { LaunchProjectDialog } from '@/components/project/launch-project-dialog';
import { ProjectData, ProjectWithRelations } from '@workspace/api';
import ProjectTicks from '@/components/project/project-ticks';
import { Button } from '@workspace/ui/components/button';
import Icons from '@workspace/ui/components/icons';
import Link from '@workspace/ui/components/link';
import { Globe, Linkedin } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function ProjectDescription({
  repo,
  project,
  isOwner,
}: {
  repo: ProjectData;
  project: ProjectWithRelations;
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
        {/* Top row: Avatar + Title + Tags */}
        <div className="flex items-start gap-3">
          <ProjectAvatar
            avatarImage={avatarImage}
            projectName={project.name}
            repoOwnerName={repo?.owner?.name || repo?.namespace?.name || ''}
            className="h-12 w-12 flex-shrink-0 rounded-none md:h-16 md:w-16"
          />
          <div className="w-full flex-1">
            <ProjectTitleAndTicks
              project={project}
              className="truncate text-lg font-bold text-white sm:text-2xl md:text-xl"
            />
            <StatusBadges project={project} />
          </div>
        </div>

        {/* Content: Description (full width) */}
        <div className="space-y-4 md:col-span-2">
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

function StatusBadges({ project }: { project: ProjectWithRelations }) {
  return (
    <div className="mt-2 flex w-full flex-row flex-wrap gap-1 md:gap-2">
      <span className="rounded-none bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-300">
        {project?.status?.displayName || project?.status?.name || 'Unknown Status'}
      </span>
      <span className="rounded-none bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-300">
        {project?.type?.displayName || project?.type?.name || 'Unknown Type'}
      </span>
      {project?.hasBeenAcquired && (
        <span className="rounded-none bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400">
          Acquired
        </span>
      )}
    </div>
  );
}

function ProjectTitleAndTicks({
  project,
  className,
}: {
  project: ProjectWithRelations;
  className: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 md:gap-3">
      <div className="flex items-center gap-2 md:gap-3">
        <h1 className={className}>{project?.name}</h1>
        <ProjectTicks project={project} />
      </div>
      <SocialLinks project={project} />
    </div>
  );
}

function SocialLinks({ project }: { project: ProjectWithRelations }) {
  if (!project?.socialLinks) return null;

  return (
    <div className="flex flex-wrap gap-3 md:gap-4">
      {project.socialLinks.website && (
        <Link
          href={project.socialLinks.website}
          target="_blank"
          event="project_page_website_link_clicked"
          eventObject={{ projectId: project.id }}
          className="flex items-center text-neutral-300 transition-colors hover:text-white"
        >
          <Globe className="h-4 w-4 flex-shrink-0" />
        </Link>
      )}
      {project.socialLinks.discord && (
        <Link
          href={project.socialLinks.discord}
          target="_blank"
          rel="noopener noreferrer"
          event="project_page_discord_link_clicked"
          eventObject={{ projectId: project.id }}
          className="flex items-center text-neutral-300 transition-colors hover:text-white"
        >
          <Icons.discord className="h-4 w-4 flex-shrink-0" />
        </Link>
      )}
      {project.socialLinks.twitter && (
        <Link
          href={project.socialLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          event="project_page_twitter_link_clicked"
          eventObject={{ projectId: project.id }}
          className="flex items-center text-neutral-300 transition-colors hover:text-white"
        >
          <Icons.twitter className="h-4 w-4 flex-shrink-0" />
        </Link>
      )}
      {project.socialLinks.linkedin && (
        <Link
          href={project.socialLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          event="project_page_linkedin_link_clicked"
          eventObject={{ projectId: project.id }}
          className="flex items-center text-neutral-300 transition-colors hover:text-white"
        >
          <Linkedin className="h-4 w-4 flex-shrink-0" />
        </Link>
      )}
    </div>
  );
}

function ProjectDescriptionText({ project }: { project: ProjectWithRelations }) {
  const [expanded, setExpanded] = useState(false);
  const description = project?.description || '';
  const CHAR_LIMIT = 300;
  const isLong = description.length > CHAR_LIMIT;
  const displayText = expanded || !isLong ? description : description.slice(0, CHAR_LIMIT) + '...';

  return (
    <div className="md:mb-6">
      <p
        className={
          `text-sm leading-relaxed break-words text-neutral-400 md:text-base` +
          (!expanded && isLong ? ' line-clamp-3' : '')
        }
      >
        {displayText}
      </p>
      {isLong && (
        <Button
          variant="link"
          size="sm"
          type="button"
          className="mt-1 px-0 text-xs font-medium"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </Button>
      )}
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
  project: ProjectWithRelations;
  repo: ProjectData;
  className: string;
}) {
  const getRepoUrl = () => {
    if (project.gitHost === 'github') {
      return repo?.html_url || project.gitRepoUrl;
    } else {
      return repo?.web_url || project.gitRepoUrl;
    }
  };

  const repoUrl = getRepoUrl();

  return (
    <div className={className}>
      {isOwner && (
        <LaunchProjectDialog
          projectId={project.id}
          projectName={project.name}
          isRepoPrivate={project.isRepoPrivate || repo?.isPrivate}
          gitRepoUrl={project.gitRepoUrl || undefined}
          gitHost={project.gitHost || undefined}
        />
      )}
      {repoUrl && (
        <Link
          href={repoUrl}
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
      )}
    </div>
  );
}
