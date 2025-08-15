'use client';

import { Form, FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@workspace/ui/components/textarea';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@workspace/auth/client';
import Link from '@workspace/ui/components/link';
import { formatDistanceToNow } from 'date-fns';
import { useTRPC } from '@/hooks/use-trpc';
import { useForm } from 'react-hook-form';
import type { Comment } from '../types';
import { toast } from 'sonner';
import { z } from 'zod/v4';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface LaunchCommentsProps {
  projectId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comments: any[];
  commentsLoading: boolean;
}

export default function LaunchComments({
  projectId,
  comments,
  commentsLoading,
}: LaunchCommentsProps) {
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
    },
  });

  // Comment mutation
  const { mutate: addComment, isPending: isCommentPending } = useMutation(
    trpc.launches.addComment.mutationOptions({
      onSuccess: () => {
        toast.success('Comment added successfully!');
        form.reset();
        queryClient.invalidateQueries({
          queryKey: trpc.launches.getComments.queryKey({ projectId }),
        });
      },
      onError: (error) => {
        // Show specific error message from API (e.g., content moderation)
        const errorMessage = error.message || 'Failed to add comment. Please try again.';
        toast.error(errorMessage);
      },
    }),
  );

  const onSubmit = (data: CommentFormData) => {
    if (!session?.user) {
      toast.error('Please login to comment');
      return;
    }
    addComment({
      projectId,
      content: data.content,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="border border-neutral-800 bg-neutral-900/50 p-6">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
        <MessageCircle className="h-5 w-5" />
        Comments ({comments?.length || 0})
      </h2>

      {/* Show empty state above input if no comments */}
      {!commentsLoading && (!comments || comments.length === 0) && (
        <div className="mb-6 py-4 text-center">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-neutral-600" />
          <p className="text-sm text-neutral-400">No comments yet.</p>
          <p className="mt-1 text-xs text-neutral-500">Be the first to comment!</p>
        </div>
      )}

      {/* Comments List */}
      <div className="mb-8 space-y-6">
        {commentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            <span className="ml-2 text-neutral-400">Loading comments...</span>
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment: Comment) => (
            <div
              key={comment.id}
              className="flex gap-4 rounded-none border border-neutral-800 bg-neutral-800/30 p-4"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user.image || ''} />
                <AvatarFallback>{comment.user.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <p className="font-semibold text-white">{comment.user.name}</p>
                  <span className="text-xs text-neutral-500">•</span>
                  <p className="text-xs text-neutral-400">
                    {formatDistanceToNow(new Date(comment.createdAt))} ago
                  </p>
                </div>
                <p className="leading-relaxed text-neutral-300">{comment.content}</p>
              </div>
            </div>
          ))
        ) : null}
      </div>

      {/* Comment Form */}
      {session?.user && (
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-full flex-col items-end gap-4"
            >
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Textarea
                        placeholder="Add your comment..."
                        className="w-full resize-none rounded-none border-neutral-700 bg-neutral-800/50 text-neutral-200 placeholder:text-neutral-500"
                        {...field}
                        onKeyDown={handleKeyDown}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isCommentPending} className="gap-2 rounded-none">
                {isCommentPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post Comment
              </Button>
            </form>
          </Form>
        </div>
      )}

      {!session?.user && (
        <div className="mt-6 rounded-none border border-neutral-800 bg-neutral-800/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-neutral-300">Login to join the conversation.</p>
            <Button asChild>
              <Link href={`/login?redirect=/launches/${projectId}`} className="rounded-none">
                Login
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
