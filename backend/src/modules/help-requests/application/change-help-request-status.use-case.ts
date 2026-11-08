import { HelpRequest, ManagedHelpRequestStatus } from '../domain/help-request';
import { HelpRequestRepository } from '../domain/help-request.repository';
import { HelpRequestApplicationError } from './help-request-application.error';

export interface ChangeHelpRequestStatusInput {
  id: string;
  status: ManagedHelpRequestStatus;
  changedById: string;
}

export class ChangeHelpRequestStatusUseCase {
  constructor(
    private readonly repository: HelpRequestRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ChangeHelpRequestStatusInput): Promise<HelpRequest> {
    const result = await this.repository.changeStatus({
      id: input.id,
      status: input.status,
      changedById: input.changedById,
      changedAt: this.now(),
    });
    if (result.kind === 'not-found') {
      throw new HelpRequestApplicationError(
        404,
        'HELP_REQUEST_NOT_FOUND',
        'Help request not found',
      );
    }
    return result.helpRequest;
  }
}
