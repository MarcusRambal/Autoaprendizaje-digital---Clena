import { HelpRequestRepository } from '../domain/help-request.repository';
import { HelpRequestApplicationError } from './help-request-application.error';

export class DeleteHelpRequestUseCase {
  constructor(private readonly repository: HelpRequestRepository) {}

  async execute(id: string): Promise<void> {
    if ((await this.repository.delete(id)) === 'not-found') {
      throw new HelpRequestApplicationError(
        404,
        'HELP_REQUEST_NOT_FOUND',
        'Help request not found',
      );
    }
  }
}
