import type { DashboardStats, HelpRequest } from '../../../types/contracts';

export const initialRequests: HelpRequest[] = [
  { id: 1, requesterName: 'María López', topic: 'Correo electrónico', date: '2026-10-28', status: 'Pendiente' },
  { id: 2, requesterName: 'José Ramírez', topic: 'Navegación web', date: '2026-10-29', status: 'En Atención' },
  { id: 3, requesterName: 'Elena Torres', topic: 'Redes Sociales', date: '2026-10-30', status: 'Atendida' },
];

export const initialStats: DashboardStats = {
  totalRequests: 18,
  resolvedRequests: 12,
  topCategories: [
    { label: 'Correo electrónico', value: 45 },
    { label: 'Navegación web', value: 32 },
    { label: 'Redes Sociales', value: 27 },
  ],
  topGuides: [
    { label: 'Primeros pasos con el correo', value: 68 },
    { label: 'Cómo navegar por internet', value: 51 },
    { label: 'Uso seguro de redes sociales', value: 39 },
  ],
};
