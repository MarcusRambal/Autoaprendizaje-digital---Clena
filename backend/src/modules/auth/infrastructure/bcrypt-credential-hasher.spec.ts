import { BcryptCredentialHasher } from './bcrypt-credential-hasher';

describe('BcryptCredentialHasher', () => {
  it('hashes credentials and verifies them without relying on a fixed hash', async () => {
    const hasher = new BcryptCredentialHasher(10);
    const hash = await hasher.hash('correct horse battery staple');

    expect(hash).not.toBe('correct horse battery staple');
    expect(await hasher.verify('correct horse battery staple', hash)).toBe(
      true,
    );
    expect(await hasher.verify('incorrect password', hash)).toBe(false);
  });
});
