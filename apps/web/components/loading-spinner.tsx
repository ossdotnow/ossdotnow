import { cn } from '@workspace/ui/lib/utils';

export default function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center')}>
      <div
        className={cn(
          'h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-500',
          className,
        )}
      ></div>
    </div>
  );
}
