'use client';

import {
  ArrowUp,
  MessageCircle,
  Share2,
  ExternalLink,
  Calendar,
  User,
  Star,
  GitFork,
  Send,
  ChevronRight,
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@workspace/ui/components/form';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Separator } from '@workspace/ui/components/separator';
import { Textarea } from '@workspace/ui/components/textarea';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@workspace/auth/client';
import Link from '@workspace/ui/components/link';
import { formatDistanceToNow } from 'date-fns';
import { useTRPC } from '@/hooks/use-trpc';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { use } from 'react';
import { z } from 'zod/v4';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
});

type CommentFormData = z.infer<typeof commentSchema>;

export default function LaunchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const { data: session } = authClient.useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: '',
    },
  });

  // Fetch launch details
  const { data: launch, isLoading: launchLoading } = useQuery(
    trpc.launches.getLaunchByProjectId.queryOptions({ projectId }),
  );

  // Fetch project details
  const { data: project } = useQuery(trpc.projects.getProject.queryOptions({ id: projectId }));

  // Fetch comments
  const { data: comments, isLoading: commentsLoading } = useQuery(
    trpc.launches.getComments.queryOptions({ projectId }),
  );

  // Vote mutation
  const voteMutation = useMutation({
    ...trpc.launches.voteProject.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.launches.getLaunchByProjectId.queryKey({ projectId }),
      });
    },
    onError: () => {
      toast.error('Failed to vote. Please try again.');
    },
  });

  // Comment mutation
  const commentMutation = useMutation(
    trpc.launches.addComment.mutationOptions({
      onSuccess: () => {
        toast.success('Comment added successfully!');
        form.reset();
        queryClient.invalidateQueries({
          queryKey: trpc.launches.getComments.queryKey({ projectId }),
        });
      },
      onError: () => {
        toast.error('Failed to add comment. Please try again.');
      },
    }),
  );

  const handleVote = async () => {
    if (!session?.user) {
      toast.error('Please login to vote');
      return;
    }
    voteMutation.mutate({ projectId });
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: launch?.name,
          text: launch?.tagline,
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const onSubmit = (data: CommentFormData) => {
    if (!session?.user) {
      toast.error('Please login to comment');
      return;
    }
    commentMutation.mutate({
      projectId,
      content: data.content,
    });
  };

  if (launchLoading || !launch) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="py-12 text-center">
          <p className="text-neutral-400">Loading launch details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
          <Link href="/launches" className="hover:text-neutral-200">
            Launches
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>{launch.name}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold">{launch.name}</h1>
            <p className="text-lg text-neutral-400">{launch.tagline}</p>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={launch.owner?.image} />
                  <AvatarFallback>{launch.owner?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{launch.owner?.name || 'Unknown'}</p>
                  <p className="text-xs text-neutral-400">
                    Launched{' '}
                    {launch.launchDate
                      ? formatDistanceToNow(new Date(launch.launchDate))
                      : 'recently'}{' '}
                    ago
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Button
              variant={launch.hasVoted ? 'default' : 'outline'}
              size="lg"
              className={`flex h-auto flex-col items-center gap-1 px-6 py-3 ${
                launch.hasVoted ? 'bg-orange-500 hover:bg-orange-600' : ''
              }`}
              onClick={handleVote}
              disabled={voteMutation.isPending}
            >
              <ArrowUp className="h-5 w-5" />
              <span className="text-lg font-semibold">{launch.voteCount}</span>
              <span className="text-xs">VOTES</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex gap-3">
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            View Full Project
          </Button>
        </Link>
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      {/* Tags */}
      {launch.tags && launch.tags.length > 0 && (
        <div className="mb-8 flex gap-2">
          {launch.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Separator className="mb-8" />

      {/* Project Description */}
      {(launch.detailedDescription || launch.description) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-400">{launch.detailedDescription || launch.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments ({comments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Comment Form */}
          {session?.user && (
            <div className="mb-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Add a comment..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={commentMutation.isPending} className="gap-2">
                      <Send className="h-4 w-4" />
                      Post Comment
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <p className="text-center text-neutral-400">Loading comments...</p>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.image} />
                    <AvatarFallback>{comment.user?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.user?.name || 'Unknown'}</span>
                      <span className="text-xs text-neutral-400">
                        {formatDistanceToNow(new Date(comment.createdAt))} ago
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-neutral-400">
              No comments yet. Be the first to comment!
            </p>
          )}

          {!session?.user && (
            <div className="py-4 text-center">
              <p className="text-sm text-neutral-400">
                <Link href="/login" className="text-orange-500 hover:text-orange-400">
                  Login
                </Link>{' '}
                to comment on this launch
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
