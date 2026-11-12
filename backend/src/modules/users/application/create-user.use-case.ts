import { CredentialHasher } from '../../auth/domain/credential-hasher.port';
import { Email, InvalidEmailError } from '../../auth/domain/email.vo';
import {
  PASSWORD_MAX_UTF8_BYTES,
  PASSWORD_MIN,
  validatePassword,
  WeakPasswordError,
} from '../../auth/domain/password';
import { CreatableUserRole } from '../domain/user.repository';
import {
  CreatedUser,
  UserAccountRepository,
} from '../domain/user-account.repository';
import { UserApplicationError } from './user-application.error';

export interface CreateUserInput {
  email: string;
  password: string;
  role: string;
}

export class CreateUserUseCase {
  constructor(
    private readonly repository: UserAccountRepository,
    private readonly credentialHasher: CredentialHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<CreatedUser> {
    if (
      !input ||
      typeof input.email !== 'string' ||
      typeof input.password !== 'string' ||
      typeof input.role !== 'string'
    ) {
      throw new UserApplicationError(
        400,
        'INVALID_USER_INPUT',
        'Invalid user input',
      );
    }

    const role = this.parseRole(input.role);
    const email = this.parseEmail(input.email).toString();
    this.parsePassword(input.password);
    const passwordHash = await this.credentialHasher.hash(input.password);
    const result = await this.repository.createWithRole({
      email,
      passwordHash,
      role,
    });

    if (result.kind === 'duplicate') {
      throw new UserApplicationError(
        409,
        'EMAIL_ALREADY_REGISTERED',
        'Email already registered',
      );
    }

    return result.user;
  }

  private parseRole(raw: string): CreatableUserRole {
    if (raw !== 'STAFF' && raw !== 'PUBLIC_USER') {
      throw new UserApplicationError(
        400,
        'INVALID_ROLE',
        'Role must be STAFF or PUBLIC_USER',
      );
    }
    return raw;
  }

  private parseEmail(raw: string): Email {
    try {
      return Email.create(raw);
    } catch (error) {
      if (error instanceof InvalidEmailError) {
        throw new UserApplicationError(400, 'INVALID_EMAIL', 'Invalid email');
      }
      throw error;
    }
  }

  private parsePassword(raw: string): void {
    try {
      validatePassword(raw);
    } catch (error) {
      if (error instanceof WeakPasswordError) {
        throw new UserApplicationError(
          400,
          'WEAK_PASSWORD',
          `Password must be at least ${PASSWORD_MIN} characters and at most ${PASSWORD_MAX_UTF8_BYTES} UTF-8 bytes`,
        );
      }
      throw error;
    }
  }
}
