import { useState } from 'react';
import { getPage } from './pagination';

export function usePagination<T>(items: T[], scope: string) {
  const [selection, setSelection] = useState({ scope, page: 1 });
  const result = getPage(items, selection.scope === scope ? selection.page : 1);
  if (selection.scope !== scope || selection.page !== result.page) {
    setSelection({ scope, page: result.page });
  }
  return {
    ...result,
    setPage: (page: number) => setSelection({ scope, page })
  };
}
