import { GitManager, GitManagerConfig } from './types';
import { GitlabManager } from './gitlab';
import { GithubManager } from './github';

const supportedProviders = {
  github: GithubManager,
  gitlab: GitlabManager,
};

export const createDriver = (
  provider: keyof typeof supportedProviders | (string & {}),
  config: GitManagerConfig,
): GitManager => {
  const Provider = supportedProviders[provider as keyof typeof supportedProviders];
  if (!Provider) throw new Error('Provider not supported');
  return new Provider(config);
};
