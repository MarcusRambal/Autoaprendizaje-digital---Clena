// AdminPanel/AdminPanel.tsx

import './AdminPanel.css';
import { Link } from 'react-router-dom';

export const AdminPanel = () => {
  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>  
      <p>Welcome to the Admin Panel</p>

      <div className="options-container" id="options-container">   
        <div className="option" id="edit-option">
          <Link to="/Admin/EditGuides">Crear o Editar guías</Link>
        </div>
        <div className="option" id="edit-quiz-option">
          <Link to="/Admin/EditQuiz">Crear o Editar cuestionarios</Link>
        </div>
        <div className="option" id="requests-option">
          <Link to="/Admin/Requests">Solicitudes</Link>
        </div>
        <div className="option" id="statistics-option">
          <Link to="/Admin/Statistics">Estadísticas</Link>
        </div>
      </div>
    </div>
  );
};