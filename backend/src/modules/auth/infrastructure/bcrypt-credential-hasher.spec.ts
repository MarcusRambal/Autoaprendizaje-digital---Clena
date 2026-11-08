import { BcryptCredentialHasher } from './bcrypt-credential-hasher';
import { ConfigService } from '@nestjs/config';

describe('BcryptCredentialHasher', () => {
  const config = { getOrThrow: () => 10 } as unknown as ConfigService;
  const hasher = new BcryptCredentialHasher(config);

  it('hash produces a bcrypt hash', async () => {
    await expect(hasher.hash('secret')).resolves.toMatch(/^\$2[aby]\$/);
  });

  it('verify accepts correct password', async () => {
    const h = await hasher.hash('secret');
    await expect(hasher.verify('secret', h)).resolves.toBe(true);
  });

  it('verify rejects wrong password', async () => {
    const h = await hasher.hash('secret');
    await expect(hasher.verify('wrong', h)).resolves.toBe(false);
  });

  it('verify returns false on malformed hash (no throw)', async () => {
    await expect(hasher.verify('secret', 'garbage')).resolves.toBe(false);
  });

  it('hash rejects > 72 bytes', async () => {
    await expect(hasher.hash('a'.repeat(73))).rejects.toThrow(/72/);
  });

  it('enforces the bcrypt byte limit for UTF-8 passwords', async () => {
    const atLimit = '😀'.repeat(18);
    const overLimit = '😀'.repeat(19);
    const hash = await hasher.hash(atLimit);

    await expect(hasher.verify(atLimit, hash)).resolves.toBe(true);
    await expect(hasher.hash(overLimit)).rejects.toThrow(/72/);
    await expect(hasher.verify(overLimit, hash)).resolves.toBe(false);
  });

  it('rejects rounds outside the supported range', async () => {
    const invalidConfig = {
      getOrThrow: () => 9,
    } as unknown as ConfigService;
    const invalidHasher = new BcryptCredentialHasher(invalidConfig);

    await expect(invalidHasher.hash('secret')).rejects.toThrow(
      /between 10 and 15/,
    );
  });

  it('uses BCRYPT_SALT_ROUNDS from config', async () => {
    const config = { getOrThrow: () => 10 } as unknown as ConfigService;
    const hasher = new BcryptCredentialHasher(config);
    const hash = await hasher.hash('secret');

    // hash format: $2b$<rounds>$<salt+hash>
    const rounds = Number(hash.split('$')[2]);
    expect(rounds).toBe(10);
  });
});
