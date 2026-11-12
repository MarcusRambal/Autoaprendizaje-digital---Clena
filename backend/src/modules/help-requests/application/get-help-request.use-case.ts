import { HelpRequest } from '../domain/help-request';
import { HelpRequestRepository } from '../domain/help-request.repository';
import { HelpRequestApplicationError } from './help-request-application.error';

export class GetHelpRequestUseCase {
  constructor(private readonly repository: HelpRequestRepository) {}

  async execute(id: string): Promise<HelpRequest> {
    const helpRequest = await this.repository.findById(id);
    if (!helpRequest) {
      throw new HelpRequestApplicationError(
        404,
        'HELP_REQUEST_NOT_FOUND',
        'Help request not found',
      );
    }
    return helpRequest;
  }
}
