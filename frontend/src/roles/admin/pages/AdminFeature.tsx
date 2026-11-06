import { Link } from 'react-router-dom';

const features = {
  users: {
    title: 'Usuarios y roles',
    description: 'Creación de cuentas del personal, cambio de contraseñas, desactivación y atención de solicitudes de eliminación o anonimización.',
  },
  audit: {
    title: 'Auditoría',
    description: 'Consulta de acciones realizadas en la plataforma, con responsable y fecha.',
  },
  privacy: {
    title: 'Privacidad y consentimiento',
    description: 'Administración de avisos de privacidad y términos de consentimiento.',
  },
  backups: {
    title: 'Respaldos',
    description: 'Consulta del estado de la base de datos y de los respaldos disponibles.',
  },
} as const;

export const AdminFeature = ({ feature }: { feature: keyof typeof features }) => (
  <section className="admin-panel">
    <h1>{features[feature].title}</h1>
    <p>{features[feature].description}</p>
    <p role="status">Esta función aún no está disponible. Requiere implementación y conexión con el servidor.</p>
    <Link to="/Admin">Volver a administración</Link>
  </section>
);
