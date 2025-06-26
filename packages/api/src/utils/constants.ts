export const PROVIDER_URL_PATTERNS = {
  github: /(?:https?:\/\/github\.com\/|^)([^/]+)\/([^/]+?)(?:\.git|\/|$)/,
  gitlab: /(?:https?:\/\/gitlab\.com\/|^)([^/]+)\/([^/]+?)(?:\.git|\/|$)/,
} as const;
