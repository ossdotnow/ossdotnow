# API Package - Server-Side Caching

## Overview

This package implements server-side caching for GitHub and GitLab API responses using Redis (Upstash). This significantly improves performance and reduces API rate limit consumption.

## Caching Architecture

### Cache Storage

- **Redis Provider**: Upstash Redis
- **Connection**: Uses existing Redis configuration from environment variables
- **Key Format**: `api:cache:{provider}:{type}:{identifier}`

### Cached Endpoints

All GitHub and GitLab API responses are cached with appropriate TTLs:

| Endpoint          | TTL        | Description                  |
| ----------------- | ---------- | ---------------------------- |
| `getRepo`         | 5 minutes  | Repository metadata          |
| `getContributors` | 1 hour     | Repository contributors      |
| `getIssues`       | 10 minutes | Repository issues            |
| `getPullRequests` | 10 minutes | Pull requests/merge requests |
| `getUserDetails`  | 30 minutes | User profile information     |

### Cache Keys

Cache keys follow this pattern:

```
api:cache:{provider}:{type}:{identifier}
```

Examples:

- `api:cache:github:repo:owner:repo`
- `api:cache:gitlab:user:username`
- `api:cache:github:contributors:owner:repo`

## Usage

### Automatic Caching

All API calls through the TRPC routers are automatically cached:

```typescript
// This call will be cached for 5 minutes
const { data } = trpc.repository.getRepo.useQuery({
  url: 'owner/repo',
  provider: 'github',
});
```

### Cache Invalidation

To manually invalidate cached data:

```typescript
// Invalidate all cache for a provider
await trpc.repository.invalidateCache.mutate({
  provider: 'github',
});

// Invalidate specific type for a provider
await trpc.repository.invalidateCache.mutate({
  provider: 'gitlab',
  type: 'repo',
});

// Invalidate specific repository data
await trpc.repository.invalidateCache.mutate({
  provider: 'github',
  identifier: 'owner/repo',
  type: 'repo',
});
```

## Implementation Details

### Cache Utility (`utils/cache.ts`)

The caching logic is implemented in a reusable utility that:

1. Checks Redis for cached data
2. Falls back to the API if cache miss
3. Stores the response with TTL
4. Handles errors gracefully (cache failures don't break the API)

### Error Handling

- Cache read/write errors are logged but don't affect API functionality
- API continues to work even if Redis is unavailable
- Cached errors are not stored (only successful responses)

## Benefits

1. **Performance**: Reduces API response times from seconds to milliseconds
2. **Rate Limits**: Reduces GitHub/GitLab API consumption
3. **Reliability**: Provides resilience against API rate limits
4. **Cost**: Reduces external API calls

## Monitoring

Cache hit/miss rates and errors are logged to the console. In production, these should be sent to your monitoring service.

## Future Improvements

1. Add cache warming for popular repositories
2. Implement cache analytics dashboard
3. Add configurable TTLs per repository
4. Implement partial cache invalidation
