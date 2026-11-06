import { ConfigService } from '@nestjs/config';
import { ExecutionContext, HttpException } from '@nestjs/common';
import { AuthThrottleGuard } from './auth-throttle.guard';

function createGuard(limit = 2, ttl = 1_000): AuthThrottleGuard {
  const config = {
    getOrThrow: (key: string) => (key === 'AUTH_THROTTLE_TTL' ? ttl : limit),
  } as ConfigService;
  return new AuthThrottleGuard(config);
}

function createContext(ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ ip }) }),
  } as ExecutionContext;
}

describe('AuthThrottleGuard', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('limits requests independently for each client address', () => {
    const guard = createGuard(2);
    const firstClient = createContext('192.0.2.1');
    const secondClient = createContext('192.0.2.2');

    expect(guard.canActivate(firstClient)).toBe(true);
    expect(guard.canActivate(firstClient)).toBe(true);
    let failure: unknown;
    try {
      guard.canActivate(firstClient);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(HttpException);
    expect((failure as HttpException).getStatus()).toBe(429);
    expect(guard.canActivate(secondClient)).toBe(true);
  });

  it('allows requests again after the rate-limit window expires', () => {
    jest.useFakeTimers().setSystemTime(new Date('2029-01-01T00:00:00.000Z'));
    const guard = createGuard(1, 1_000);
    const context = createContext('192.0.2.1');

    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(HttpException);

    jest.advanceTimersByTime(1_000);

    expect(guard.canActivate(context)).toBe(true);
  });
});
