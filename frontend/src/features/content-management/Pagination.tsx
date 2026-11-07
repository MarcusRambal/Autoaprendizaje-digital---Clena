interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  label: string;
}

export function Pagination({ page, totalPages, setPage, label }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav className="content-pagination" aria-label={label}>
      <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
      <span aria-live="polite">Página {page} de {totalPages}</span>
      <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Siguiente</button>
    </nav>
  );
}
