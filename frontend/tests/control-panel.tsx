import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/global.css';
import '../src/shared/styles/OperationsTheme.css';
import { ControlPanel } from '../src/features/content-management/ControlPanel';
import { controlPanelData } from './fixtures/controlPanelData';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="admin-layout">
      <main className="content">
        <h1>Panel de prueba</h1>
        <p>Datos simulados en memoria: 26 categorías, 208 guías y 104 lecciones. Recarga para restablecerlos.</p>
        <ControlPanel initialData={controlPanelData} />
      </main>
    </div>
  </StrictMode>
);
