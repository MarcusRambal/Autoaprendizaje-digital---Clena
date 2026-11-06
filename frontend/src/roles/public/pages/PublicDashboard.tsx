import { Link } from 'react-router-dom';
import { useAuth } from '../../../../services/authState';

export const PublicDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="public-page">
      <h1>Aprende a tu ritmo</h1>
      <p>{user?.userRole === 'student' ? 'Bienvenido a tu espacio de aprendizaje.' : 'Puedes explorar las guías y practicar sin crear una cuenta.'}</p>
      <div className="public-cards">
        <Link to="/StudentsHome/Guides"><strong>Guías paso a paso</strong><span>Aprende con explicaciones sencillas.</span></Link>
        <Link to="/StudentsHome/Quiz"><strong>Practicar</strong><span>Responde una actividad de ejemplo.</span></Link>
        <Link to="/StudentsHome/Progress"><strong>Mi progreso</strong><span>Inicia sesión para consultar esta sección.</span></Link>
      </div>
      <Link className="public-help" to="/StudentsHome/Help">Necesito ayuda presencial</Link>
      <p>La solicitud digital de ayuda aún no está disponible.</p>
    </div>
  );
};
