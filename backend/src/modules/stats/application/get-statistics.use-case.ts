import { Statistics } from '../domain/statistics';
import { StatsRepository } from '../domain/stats.repository';
import { StatsApplicationError } from './stats-application.error';

export interface GetStatisticsInput {
  from?: string;
  to?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MINIMUM_DATE = '2020-01-01';

function bogotaDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function invalidRange(message: string): StatsApplicationError {
  return new StatsApplicationError(400, 'INVALID_STATS_RANGE', message);
}

export class GetStatisticsUseCase {
  constructor(
    private readonly repository: StatsRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: GetStatisticsInput = {}): Promise<Statistics> {
    if (
      (input.from !== undefined && typeof input.from !== 'string') ||
      (input.to !== undefined && typeof input.to !== 'string')
    ) {
      throw invalidRange('Dates must use YYYY-MM-DD format');
    }

    const today = bogotaDate(this.now());
    const from = input.from ?? addDays(input.to ?? today, -29);
    const to = input.to ?? today;

    if (!isCalendarDate(from) || !isCalendarDate(to)) {
      throw invalidRange('Dates must use YYYY-MM-DD format');
    }
    if (from < MINIMUM_DATE) {
      throw invalidRange(`from must be on or after ${MINIMUM_DATE}`);
    }
    if (from > to) {
      throw invalidRange('from must be on or before to');
    }
    if (to > addDays(today, 1)) {
      throw invalidRange('to cannot be more than one day in the future');
    }

    const rangeDays =
      (Date.parse(`${to}T00:00:00.000Z`) -
        Date.parse(`${from}T00:00:00.000Z`)) /
        DAY_MS +
      1;
    if (rangeDays > 366) {
      throw invalidRange('Date range cannot exceed 366 days');
    }

    const fromDate = new Date(`${from}T00:00:00-05:00`);
    const toDate = new Date(`${to}T23:59:59.999-05:00`);
    const statistics = await this.repository.getStatistics(fromDate, toDate);

    return {
      ...statistics,
      range: { from, to },
      topGuides: [...statistics.topGuides]
        .sort((left, right) => right.views - left.views)
        .slice(0, 10),
      topCategories: [...statistics.topCategories]
        .sort((left, right) => right.views - left.views)
        .slice(0, 10),
    };
  }
}
