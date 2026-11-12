import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitBucket {
  expiresAt: number;
  count: number;
}

@Injectable()
export class GuideViewThrottleGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly ttl = 60_000;
  private readonly limit = 60;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const now = Date.now();

    for (const [bucketKey, bucket] of this.buckets) {
      if (bucket.expiresAt <= now) this.buckets.delete(bucketKey);
    }

    let bucket = this.buckets.get(key);
    if (!bucket || bucket.expiresAt <= now) {
      bucket = { expiresAt: now + this.ttl, count: 0 };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > this.limit) {
      throw new HttpException(
        'Too many guide-view requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
