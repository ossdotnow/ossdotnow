type Provider = 'github' | 'gitlab';

interface UrlParts {
  provider: Provider;
  identifier: string;
}

export function getUrlParts(url: string): UrlParts {
  const urlObject = new URL(url);
  const pathParts = urlObject.pathname.split('/').filter((part) => part);

  if (pathParts.length < 2) {
    throw new Error('Invalid repository URL');
  }

  const identifier = `${pathParts[0]}/${pathParts[1]}`;

  if (urlObject.hostname.includes('github.com')) {
    return { provider: 'github', identifier };
  }

  if (urlObject.hostname.includes('gitlab.com')) {
    return { provider: 'gitlab', identifier };
  }

  throw new Error('Unsupported git provider');
}
