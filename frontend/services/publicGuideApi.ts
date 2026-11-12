import { apiClient } from './apiClient.ts';
import type { PublicGuide } from './publicLearning';

interface PageResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiGuide {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  file: string | null;
  fileUrl: string | null;
}

export function mapPublicGuide(guide: ApiGuide): PublicGuide {
  return {
    id: guide.id,
    title: guide.title,
    description: '',
    category: guide.category,
    file: guide.file ?? '',
    fileUrl: guide.fileUrl
  };
}

export async function getPublicGuides(): Promise<PublicGuide[]> {
  const pageSize = 100;
  const firstPage = await apiClient<PageResponse<ApiGuide>>(
    `/guides?page=1&pageSize=${pageSize}`
  );
  const items = firstPage.items.map(mapPublicGuide);

  for (let page = 2; page <= firstPage.totalPages; page += 1) {
    const result = await apiClient<PageResponse<ApiGuide>>(
      `/guides?page=${page}&pageSize=${pageSize}`
    );
    items.push(...result.items.map(mapPublicGuide));
  }

  return items;
}
