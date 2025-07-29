import { env as clientEnv } from './client';
import { env } from './server';

export const getServerUrl = () => {
  return env.VERCEL_ENV !== 'production'
    ? `http://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
};

export const getClientUrl = () => {
  return clientEnv.NEXT_PUBLIC_VERCEL_ENV !== 'production'
    ? `http://${clientEnv.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : `https://${clientEnv.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
};
