import { Statistics } from './statistics';

export interface StatsRepository {
  getStatistics(from: Date, to: Date): Promise<Statistics>;
}
