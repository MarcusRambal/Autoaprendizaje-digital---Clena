import { AuthRepository } from '../domain/auth.repository';
import { CredentialHasher } from '../domain/credential-hasher.port';
import { PublicAuthUser, toPublicAuthUser } from '../domain/auth-user';
import { Email, InvalidEmailError } from '../domain/email.vo';
import {
  validatePassword,
  WeakPasswordError,
  PASSWORD_MIN,
  PASSWORD_MAX_UTF8_BYTES,
} from '../domain/password';
import { AuthApplicationError } from './auth-application.error';

export interface RegisterInput {
  email: string;
  password: string;
  privacyAccepted: boolean;
}

export const PRIVACY_NOTICE_VERSION = 'v1';

export class RegisterUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly credentialHasher: CredentialHasher,
  ) {}

  async execute(input: RegisterInput): Promise<PublicAuthUser> {
    if (
      !input ||
      typeof input.email !== 'string' ||
      typeof input.password !== 'string' ||
      input.privacyAccepted !== true
    ) {
      throw new AuthApplicationError(
        400,
        'INVALID_AUTH_INPUT',
        'Invalid input',
      );
    }
    const email = this.parseEmail(input.email);
    this.parsePassword(input.password);

    const emailValue = email.toString();

    if (await this.repository.findUserByEmail(emailValue)) {
      throw new AuthApplicationError(
        409,
        'EMAIL_ALREADY_REGISTERED',
        'Email already registered',
      );
    }

    const passwordHash = await this.credentialHasher.hash(input.password);
    const privacyAcceptedAt = new Date();
    const result = await this.repository.createUser({
      email: emailValue,
      passwordHash,
      role: 'PUBLIC_USER',
      privacyAcceptedAt,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
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

  private parseEmail(raw: string): Email {
    try {
      return Email.create(raw);
    } catch (e) {
      if (e instanceof InvalidEmailError) {
        throw new AuthApplicationError(
          400,
          'INVALID_AUTH_INPUT',
          'A valid email is required',
        );
      }
      throw e;
    }
  }

  private parsePassword(raw: string): void {
    try {
      validatePassword(raw);
    } catch (e) {
      if (e instanceof WeakPasswordError) {
        throw new AuthApplicationError(
          400,
          'WEAK_PASSWORD',
          `Password must be at least ${PASSWORD_MIN} characters and at most ${PASSWORD_MAX_UTF8_BYTES} UTF-8 bytes`,
        );
      }
      throw e;
    }
  }
}
