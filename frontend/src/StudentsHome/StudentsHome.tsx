// StudentsHome/StudentsHome.tsx

import './StudentsHome.css';
import { Link } from 'react-router-dom';

export const StudentsHome = () => {


    return (
        <div className="homeStudentsContainer">
            <h1>Welcome to the Home Students Page</h1>
              <div className="homeStudentsContent">
                <h2>Hola Sakura</h2>    
                <h3>¿Que quieres hacer hoy?</h3>
                
                <div className='buttonContainer'>

                    <div className="button"  id="guidesOption">
                        <Link className="button" id="guidesButton" to="Guides">Guias</Link>
                    </div>
                    <div className="button"  id="quizOption">
                        <Link className="button" id="quizButton" to="Quiz">Cuestionarios</Link>
                    </div>
                    <div className="button"  id="progressOption">
                        <Link className="button" id="progressButton" to="Progress">  Mi progreso</Link>
                    </div>
                </div>
              </div>
        </div>
    );
}   

