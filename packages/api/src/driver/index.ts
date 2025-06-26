import { GitManager, GitManagerConfig } from './types';
import { GitlabManager } from './gitlab';
import { GithubManager } from './github';

const supportedProviders = {
  github: GithubManager,
  gitlab: GitlabManager,
};

export const createDriver = (
  provider: keyof typeof supportedProviders,
  config: GitManagerConfig,
): GitManager => {
  const Provider = supportedProviders[provider];
  if (!Provider)
    throw new Error(
      `Provider "${provider}" not supported. Supported providers: ${Object.keys(supportedProviders).join(', ')}`,
    );
  return new Provider(config);
};
