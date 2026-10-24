// home.tsx

import './Home.css';
import { useNavigate } from 'react-router-dom';

export const Home = () => {

    const navigate = useNavigate();

    const handleButtonClick = (name: string) => {
        navigate(`/${name}`);
    }

    return (
        <div className="homeContainer">
            <h1>Welcome to the Home Page</h1>
              <div className="homeContent">
                <img src='./public/homeImage.jpeg' alt="Home" />
                <article className="homeArticle">
                    
                    <h2>Aprende a navegar por internet de forma efectiva, segura y como un profesional</h2>
                         <br />
                    <p>Antes de tomar una guia debes iniciar sesion</p>
                        <br />
                    <div className='buttonContainer'>
                        <span className="signButton" id="loginButton" onClick={() => handleButtonClick('login')}>
                            Iniciar Sesion
                        </span>

                        <span className="signButton" id="registerButton" onClick={() => handleButtonClick('register')}>
                            Registrarse
                        </span>   
                    </div>
                       
                </article>

                
                
              </div>
        </div>
    );
}