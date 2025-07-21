'use client';

import { AlertCircle, XCircle } from 'lucide-react';
import Link from '@workspace/ui/components/link';

type ErrorType = 'projectNotFound' | 'repoNotAvailable' | 'repoNotFound';

interface ProjectErrorPageProps {
  type: ErrorType;
  onTryAgain?: () => void;
}

export default function ProjectErrorPage({ type, onTryAgain }: ProjectErrorPageProps) {
  if (type === 'projectNotFound') {
    return (
      <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm text-center sm:max-w-md lg:max-w-lg">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 sm:mb-8 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
            <XCircle className="h-10 w-10 text-red-400 sm:h-12 sm:w-12 lg:h-14 lg:w-14" />
          </div>
          <h1 className="mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl lg:text-3xl">
            Project Not Found
          </h1>
          <p className="mb-6 px-2 text-sm leading-relaxed text-neutral-400 sm:mb-8 sm:px-4 sm:text-base lg:text-lg">
            The project you&apos;re looking for doesn&apos;t exist or has been removed. It might
            have been deleted or you may not have permission to view it.
          </p>
          <div className="flex flex-col justify-center gap-3 px-4 sm:flex-row sm:gap-4 sm:px-0">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-neutral-200 sm:px-6 sm:py-3 sm:text-base"
            >
              ← Back to Projects
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-neutral-700 bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-neutral-600 hover:bg-neutral-800 sm:px-6 sm:py-3 sm:text-base"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'repoNotAvailable') {
    return (
      <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xs text-center sm:max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 sm:mb-6 sm:h-20 sm:w-20">
            <AlertCircle className="h-8 w-8 text-amber-400 sm:h-10 sm:w-10" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-white sm:mb-3 sm:text-xl">
            Repository Not Available
          </h1>
          <p className="mb-4 px-2 text-center text-xs text-neutral-400 sm:mb-6 sm:px-4 sm:text-sm">
            This project doesn&apos;t have a connected Git repository. Repository data is required
            to display project statistics and activity.
          </p>
          <div className="flex flex-col justify-center gap-2 px-4 sm:flex-row sm:gap-3 sm:px-0">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-neutral-200 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              ← Browse Other Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'repoNotFound') {
    return (
      <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xs text-center sm:max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 sm:mb-6 sm:h-20 sm:w-20">
            <AlertCircle className="h-8 w-8 text-orange-400 sm:h-10 sm:w-10" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-white sm:mb-3 sm:text-xl">
            Repository Not Found
          </h1>
          <p className="mb-4 px-2 text-center text-xs text-neutral-400 sm:mb-6 sm:px-4 sm:text-sm">
            Unable to load repository data. The repository might be private, deleted, or temporarily
            unavailable. Please try again later.
          </p>
          <div className="flex flex-col justify-center gap-2 px-4 sm:flex-row sm:gap-3 sm:px-0">
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 border border-neutral-700 bg-transparent px-3 py-2 text-xs font-medium text-white transition-colors hover:border-neutral-600 hover:bg-neutral-800 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              ← Back to Projects
            </Link>
            <button
              onClick={onTryAgain}
              className="inline-flex items-center justify-center gap-2 bg-white px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-neutral-200 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
