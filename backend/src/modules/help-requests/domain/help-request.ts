export type HelpRequestStatus =
  'PENDING' | 'IN_PROGRESS' | 'ATTENDED' | 'CANCELLED';

/** Statuses the staff can move a request to from the panel. */
export type ManagedHelpRequestStatus = Exclude<HelpRequestStatus, 'CANCELLED'>;

export interface HelpRequest {
  id: string;
  /** Name of the person being helped, written by the staff member. */
  requesterName: string | null;
  topic: string;
  status: HelpRequestStatus;
  attendedById: string | null;
  attendedAt: Date | null;
  createdAt: Date;
}

export const REQUESTER_NAME_MAX_LENGTH = 100;
export const TOPIC_MIN_LENGTH = 3;
export const TOPIC_MAX_LENGTH = 200;
