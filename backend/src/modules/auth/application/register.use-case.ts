import { AuthRepository } from '../domain/auth.repository';
import { CredentialHasher } from '../domain/credential-hasher.port';
import { PublicAuthUser, toPublicAuthUser } from '../domain/auth-user';
import { AuthApplicationError } from './auth-application.error';

export interface RegisterInput {
  email: string;
  password: string;
}

export class RegisterUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly credentialHasher: CredentialHasher,
  ) {}

  async execute(input: RegisterInput): Promise<PublicAuthUser> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.password) {
      throw new AuthApplicationError(
        400,
        'INVALID_AUTH_INPUT',
        'Email and password are required',
      );
    }

    if (await this.repository.findUserByEmail(email)) {
      throw new AuthApplicationError(
        409,
        'EMAIL_ALREADY_REGISTERED',
        'Email already registered',
      );
    }

    const passwordHash = await this.credentialHasher.hash(input.password);
    const result = await this.repository.createUser({
      email,
      passwordHash,
      role: 'PUBLIC_USER',
    });
    if (result.kind === 'duplicate') {
      throw new AuthApplicationError(
        409,
        'EMAIL_ALREADY_REGISTERED',
        'Email already registered',
      );
    }

    return toPublicAuthUser(result.user);
  }
}
