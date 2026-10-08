import { z } from 'zod';

export function runtimeConfiguration() {
  const configuration = z
    .object({
      PORT: z.coerce.number().int().min(1).max(65535).default(8012),
      HOST: z.string().min(1).default('127.0.0.1'),
      FRONTEND_URL: z.url().default('http://127.0.0.1:4312'),
      TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
      DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//),
    })
    .parse(process.env);
  const url = new URL(configuration.FRONTEND_URL);
  if (
    url.origin !== configuration.FRONTEND_URL ||
    !['http:', 'https:'].includes(url.protocol)
  )
    throw new Error(
      'FRONTEND_URL doit être une origine HTTP(S) sans chemin ni slash final.',
    );
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
    throw new Error('FRONTEND_URL doit utiliser HTTPS en production.');
  return configuration;
}
