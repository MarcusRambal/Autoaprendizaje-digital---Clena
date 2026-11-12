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
  range: {
    from: string;
    to: string;
  };
  topGuides: TopGuide[];
  topCategories: TopCategory[];
  helpRequests: HelpRequestStats;
}
