import '../../../shared/styles/OperationsDashboard.css';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => (
  <div className="admin-panel">
    <h1>Administración de la plataforma</h1>
    <p>Gestiona el acceso, la privacidad y la operación de CLENA.</p>
    <div className="options-container">
      <div className="option"><Link to="/Admin/Users"><strong>Usuarios y roles</strong><span>Personal, cuentas y solicitudes de datos.</span></Link></div>
      <div className="option"><Link to="/Admin/Audit"><strong>Auditoría</strong><span>Registro de acciones administrativas.</span></Link></div>
      <div className="option"><Link to="/Admin/ControlPanel"><strong>Categorías</strong><span>Organización del contenido.</span></Link></div>
      <div className="option"><Link to="/Admin/Privacy"><strong>Privacidad y consentimiento</strong><span>Avisos y términos de uso.</span></Link></div>
      <div className="option"><Link to="/Admin/Backups"><strong>Respaldos</strong><span>Estado operativo de los respaldos.</span></Link></div>
    </div>
    <p>Las funciones administrativas reales están pendientes de implementación y conexión al servidor.</p>
  </div>
);
