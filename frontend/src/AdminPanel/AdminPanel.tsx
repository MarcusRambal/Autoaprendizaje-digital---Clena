// AdminPanel/AdminPanel.tsx

import './AdminPanel.css';
import { Link } from 'react-router-dom';

export const AdminPanel = () => {
  return (
    <div className="admin-panel">
      <h1>Panel de administración</h1>
      <p>Administra el contenido y acompaña a los usuarios de CLENA.</p>

      <div className="options-container" id="options-container">   
        <div className="option" id="edit-option">
          <Link to="/Admin/ControlPanel"><strong>Panel de control</strong><span>Administra categorías, guías y quizzes.</span></Link>
        </div>
        <div className="option" id="requests-option">
          <Link to="/Admin/Requests"><strong>Solicitudes</strong><span>Consulta y gestiona las solicitudes de ayuda.</span></Link>
        </div>
        <div className="option" id="statistics-option">
          <Link to="/Admin/Statistics"><strong>Estadísticas</strong><span>Revisa un resumen de la actividad.</span></Link>
        </div>
      </div>
    </div>
  );
};