import {
  HelpRequest,
  REQUESTER_NAME_MAX_LENGTH,
  TOPIC_MAX_LENGTH,
  TOPIC_MIN_LENGTH,
} from '../domain/help-request';
import { HelpRequestRepository } from '../domain/help-request.repository';
import { HelpRequestApplicationError } from './help-request-application.error';

export interface CreateHelpRequestInput {
  requesterName: string;
  topic: string;
}

export class CreateHelpRequestUseCase {
  constructor(private readonly repository: HelpRequestRepository) {}

  async execute(input: CreateHelpRequestInput): Promise<HelpRequest> {
    const requesterName = input.requesterName.trim();
    const topic = input.topic.trim();

    if (
      requesterName.length < 1 ||
      requesterName.length > REQUESTER_NAME_MAX_LENGTH
    ) {
      throw new HelpRequestApplicationError(
        400,
        'INVALID_HELP_REQUEST',
        `Requester name must have between 1 and ${REQUESTER_NAME_MAX_LENGTH} characters`,
      );
    }
    if (topic.length < TOPIC_MIN_LENGTH || topic.length > TOPIC_MAX_LENGTH) {
      throw new HelpRequestApplicationError(
        400,
        'INVALID_HELP_REQUEST',
        `Topic must have between ${TOPIC_MIN_LENGTH} and ${TOPIC_MAX_LENGTH} characters`,
      );
    }

    return await this.repository.create({ requesterName, topic });
  }
}
