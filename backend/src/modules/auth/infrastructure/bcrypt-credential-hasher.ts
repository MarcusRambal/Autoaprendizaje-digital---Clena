import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CredentialHasher } from '../domain/credential-hasher.port';

@Injectable()
export class BcryptCredentialHasher implements CredentialHasher {
  constructor(private readonly saltRounds = 12) {}

  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }

  verify(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
