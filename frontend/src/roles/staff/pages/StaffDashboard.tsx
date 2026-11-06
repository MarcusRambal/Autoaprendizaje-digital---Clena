import { Link } from 'react-router-dom';
import '../../../shared/styles/OperationsDashboard.css';
import { initialRequests, initialStats } from '../demoData';

export const StaffDashboard = () => (
  <div className="admin-panel">
    <h1>Panel del personal</h1>
    <p>Gestiona contenido y acompaña a las personas que usan CLENA.</p>
    <p role="status"><strong>Demostración:</strong> los datos del panel son ejemplos y no representan solicitudes ni estadísticas reales.</p>
    <section aria-labelledby="staff-requests-title">
      <h2 id="staff-requests-title">Solicitudes pendientes de ejemplo</h2>
      {initialRequests.filter(request => request.status === 'Pendiente').map(request => (
        <p key={request.id}>{request.requesterName}: {request.topic}</p>
      ))}
      <Link to="/Staff/Requests">Ver solicitudes de ejemplo</Link>
    </section>
    <section aria-labelledby="staff-topics-title">
      <h2 id="staff-topics-title">Temas más consultados de ejemplo</h2>
      {initialStats.topCategories.map(category => <p key={category.label}>{category.label}: {category.value}</p>)}
      <Link to="/Staff/Statistics">Ver estadísticas de ejemplo</Link>
    </section>
    <div className="options-container">
      <div className="option"><Link to="/Staff/Content"><strong>Guías y quizzes</strong><span>Organiza el contenido de aprendizaje.</span></Link></div>
      <div className="option"><Link to="/Staff/Requests"><strong>Solicitudes de ayuda</strong><span>Revisa ejemplos de atención presencial.</span></Link></div>
      <div className="option"><Link to="/Staff/Statistics"><strong>Estadísticas</strong><span>Consulta ejemplos de actividad.</span></Link></div>
    </div>
    <p>La publicación de contenido y el envío de solicitudes reales están pendientes de conexión con el servidor.</p>
  </div>
);
