import { apiClient } from "./apiClient.ts";

export interface StatisticsRange {
  from: string;
  to: string;
}

export interface TopGuide {
  id: string;
  title: string;
  categoryTitle: string;
  views: number;
}

export interface TopCategory {
  id: string;
  title: string;
  views: number;
}

export interface HelpRequestStats {
  total: number;
  attended: number;
}

export interface Statistics {
  range: StatisticsRange;
  topGuides: TopGuide[];
  topCategories: TopCategory[];
  helpRequests: HelpRequestStats;
}

export function getStatistics({
  from,
  to,
}: StatisticsRange): Promise<Statistics> {
  const query = new URLSearchParams({ from, to });
  return apiClient<Statistics>(`/stats?${query.toString()}`);
}

export function trackGuideView(guideId: string): Promise<void> {
  return apiClient<void>(`/guides/${encodeURIComponent(guideId)}/view`, {
    method: "POST",
  });
}
