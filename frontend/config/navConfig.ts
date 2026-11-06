// services/navConfig.ts

export interface NavLinkItem {
  label: string;
  path: string;
}

export const NAV_LINKS: Record<string, NavLinkItem[]> = {
  admin: [
    { label: 'Inicio', path: '/Admin' },
    { label: 'Panel de Control', path: '/Admin/ControlPanel' },
    { label: 'Solicitudes', path: '/Admin/Requests' },
    { label: 'Estadísticas', path: '/Admin/Statistics' },
  ],
  student: [
    { label: 'Inicio', path: '/StudentsHome' },
    { label: 'Guias', path: '/StudentsHome/Guides' },
    { label: 'Quiz', path: '/StudentsHome/Quiz' },
    { label: 'Progreso', path: '/StudentsHome/Progress' },    
  ],
};