import './ControlPanel.css';

import { useState } from 'react';
import { EditCategoriesPanel } from './EditCategoriesPanel';
import { EditGuidesPanel } from './EditGuidesPanel';
import { EditQuizPanel } from './EditQuizPanel';


export const ControlPanel = () => {
  // Estado para alternar entre 'guides' y 'quizzes'
  const [activeSection, setActiveSection] = useState<'guides' | 'quizzes'>('guides');

  return (
    <div className="control-panel">
      <h2>Control Panel</h2>

      <div className="control-panel-grid">
        {/* --- Columna Izquierda: Categorías --- */}
        <aside className="control-panel-left">
          <EditCategoriesPanel />
        </aside>

        {/* --- Columna Derecha: Guías / Quizzes --- */}
        <main className="control-panel-right">
          {/* Botones de selección de sección */}
          <div className="section-tabs">
            <button
              type="button"
              className={`tab-btn ${activeSection === 'guides' ? 'active' : ''}`}
              onClick={() => setActiveSection('guides')}
            >
              Guías
            </button>
            <button
              type="button"
              className={`tab-btn ${activeSection === 'quizzes' ? 'active' : ''}`}
              onClick={() => setActiveSection('quizzes')}
            >
              Quizzes
            </button>
          </div>

          {/* Renderizado condicional según la pestaña activa */}
          <div className="section-content">
            {activeSection === 'guides' && <EditGuidesPanel />}
            {activeSection === 'quizzes' && <EditQuizPanel />}
          </div>
        </main>
      </div>
    </div>
  );
};