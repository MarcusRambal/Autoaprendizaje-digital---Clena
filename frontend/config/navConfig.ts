import type { AppRole } from '../services/authApi';

export interface NavLinkItem {
  label: string;
  path: string;
}

export const NAV_LINKS: Record<AppRole, NavLinkItem[]> = {
  admin: [
    { label: 'Inicio', path: '/Admin' },
    { label: 'Categorías', path: '/Admin/ControlPanel' },
    { label: 'Usuarios', path: '/Admin/Users' },
    { label: 'Privacidad', path: '/Admin/Privacy' },
    { label: 'Auditoría', path: '/Admin/Audit' },
    { label: 'Respaldos', path: '/Admin/Backups' },
  ],
  staff: [
    { label: 'Inicio', path: '/Staff' },
    { label: 'Guías y quizzes', path: '/Staff/Content' },
    { label: 'Solicitudes', path: '/Staff/Requests' },
    { label: 'Estadísticas', path: '/Staff/Statistics' },
    { label: 'Privacidad', path: '/Staff/Privacy' },
  ],
  student: [
    { label: 'Inicio', path: '/StudentsHome' },
    { label: 'Guías', path: '/StudentsHome/Guides' },
    { label: 'Lecciones', path: '/StudentsHome/Quiz' },
    { label: 'Progreso', path: '/StudentsHome/Progress' },
    { label: 'Ayuda', path: '/StudentsHome/Help' },
    { label: 'Privacidad', path: '/StudentsHome/Privacy' },
  ],
};

export const GUEST_LINKS: NavLinkItem[] = [
  { label: 'Inicio', path: '/StudentsHome' },
  { label: 'Guías', path: '/StudentsHome/Guides' },
  { label: 'Lecciones', path: '/StudentsHome/Quiz' },
  { label: 'Ayuda', path: '/StudentsHome/Help' },
];