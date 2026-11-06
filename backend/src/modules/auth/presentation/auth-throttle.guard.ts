import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface RateLimitBucket {
  expiresAt: number;
  count: number;
}

@Injectable()
export class AuthThrottleGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly ttl: number;
  private readonly limit: number;

  constructor(config: ConfigService) {
    this.ttl = config.getOrThrow<number>('AUTH_THROTTLE_TTL');
    this.limit = config.getOrThrow<number>('AUTH_THROTTLE_LIMIT');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    for (const [bucketKey, bucket] of this.buckets) {
      if (bucket.expiresAt <= now) {
        this.buckets.delete(bucketKey);
      }
    }

    let bucket = this.buckets.get(key);
    if (!bucket || bucket.expiresAt <= now) {
      bucket = { expiresAt: now + this.ttl, count: 0 };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > this.limit) {
      throw new HttpException(
        'Too many authentication requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
