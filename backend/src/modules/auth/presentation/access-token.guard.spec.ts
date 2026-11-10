import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import {
  TOKEN_ISSUER,
  TokenIssuer,
  VerifiedAccessToken,
} from '../domain/token-issuer.port';
import { AccessTokenGuard } from './access-token.guard';

interface FakeRequest {
  headers: Record<string, string | undefined>;
  user?: unknown;
}

function setup(verified: VerifiedAccessToken | null = null) {
  const verifiedTokens: string[] = [];
  const tokenIssuer = {
    verifyAccessToken: (token: string) => {
      verifiedTokens.push(token);
      return Promise.resolve(verified);
    },
  } as unknown as TokenIssuer;
  const run = (headers: FakeRequest['headers']) => {
    const request: FakeRequest = { headers };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return {
      request,
      result: new AccessTokenGuard(tokenIssuer).canActivate(context),
    };
  };
  return { run, verifiedTokens };
}

describe('AccessTokenGuard', () => {
  it('uses a unique injection token for the token issuer', () => {
    expect(typeof TOKEN_ISSUER).toBe('symbol');
    expect(TOKEN_ISSUER.description).toBe('TOKEN_ISSUER');
  });

  it.each([
    ['no Authorization header', {}],
    ['a scheme other than Bearer', { authorization: 'Basic abc123' }],
    ['a Bearer header without a token', { authorization: 'Bearer' }],
  ])('rejects a request with %s', async (_name, headers) => {
    const { run, verifiedTokens } = setup();

    await expect(run(headers).result).rejects.toThrow(
      new UnauthorizedException('Authentication required'),
    );
    expect(verifiedTokens).toHaveLength(0);
  });

  it('rejects a token that does not verify', async () => {
    const { run, verifiedTokens } = setup(null);

    await expect(
      run({ authorization: 'Bearer forged-token' }).result,
    ).rejects.toThrow(new UnauthorizedException('Invalid access token'));
    expect(verifiedTokens).toEqual(['forged-token']);
  });

  it('accepts a verified token and exposes the user on the request', async () => {
    const { run, verifiedTokens } = setup({
      userId: 'user-1',
      email: 'ana@example.com',
      role: 'STAFF',
    });

    const { request, result } = run({ authorization: 'Bearer good-token' });

    await expect(result).resolves.toBe(true);
    expect(verifiedTokens).toEqual(['good-token']);
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'ana@example.com',
      role: 'STAFF',
    });
  });
});
