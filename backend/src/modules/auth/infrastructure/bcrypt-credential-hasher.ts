// infrastructure/bcrypt-credential-hasher.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CredentialHasher } from '../domain/credential-hasher.port';

const MAX_BYTES = 72;

@Injectable()
export class BcryptCredentialHasher implements CredentialHasher {
  constructor(private readonly config: ConfigService) {}

  async hash(plainText: string): Promise<string> {
    if (Buffer.byteLength(plainText, 'utf8') > MAX_BYTES) {
      throw new Error(`Password exceeds bcrypt ${MAX_BYTES}-byte limit`);
    }
    return bcrypt.hash(plainText, this.saltRounds());
  }

  async verify(plainText: string, hash: string): Promise<boolean> {
    if (Buffer.byteLength(plainText, 'utf8') > MAX_BYTES) {
      return false;   
    }
    try {
      return await bcrypt.compare(plainText, hash);
    } catch {
      return false;
    }
  }

  private saltRounds(): number {
    const rounds = this.config.getOrThrow<number>('BCRYPT_SALT_ROUNDS');
    if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
      throw new Error(
        `BCRYPT_SALT_ROUNDS must be an integer between 10 and 15 (got ${rounds})`,
      );
    }
    return rounds;
  }
}