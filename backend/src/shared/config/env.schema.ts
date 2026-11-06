import Joi from 'joi';
import { isIP } from 'node:net';

const positiveTtlPattern = /^(?=.*[1-9])\d+(ms|s|m|h|d)$/;

const environmentSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .invalid(Joi.ref('JWT_ACCESS_SECRET'))
    .required(),
  JWT_ACCESS_TTL: Joi.string().pattern(positiveTtlPattern).default('15m'),
  JWT_REFRESH_TTL: Joi.string().pattern(positiveTtlPattern).default('7d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
  AUTH_THROTTLE_TTL: Joi.number().integer().min(1).default(60000),
  AUTH_THROTTLE_LIMIT: Joi.number().integer().min(1).default(5),
  TRUSTED_PROXY_IPS: Joi.string()
    .empty('')
    .default([])
    .custom((value: string, helpers) => {
      if (typeof value !== 'string' || !value.trim()) {
        return [];
      }

      const entries = value.split(',').map((entry) => entry.trim());
      const validEntries = entries.every((entry) => {
        const [address, prefix, ...extra] = entry.split('/');
        const version = isIP(address);
        if (version === 0 || extra.length > 0) {
          return false;
        }
        if (prefix === undefined) {
          return true;
        }

        const maxPrefix = version === 4 ? 32 : 128;
        return /^\d+$/.test(prefix) && Number(prefix) <= maxPrefix;
      });

      return validEntries ? entries : helpers.error('any.invalid');
    }),
}).unknown(true);

interface ValidatedEnvironment extends Record<string, unknown> {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_TTL: string;
  JWT_REFRESH_TTL: string;
  BCRYPT_SALT_ROUNDS: number;
  AUTH_THROTTLE_TTL: number;
  AUTH_THROTTLE_LIMIT: number;
  TRUSTED_PROXY_IPS: string[];
}

export function validateEnv(
  environment: Record<string, unknown>,
): ValidatedEnvironment {
  const validation = environmentSchema.validate(environment, {
    abortEarly: false,
    convert: true,
  });

  if (validation.error) {
    throw new Error(
      `Invalid environment configuration: ${validation.error.message}`,
    );
  }

  return validation.value as ValidatedEnvironment;
}
