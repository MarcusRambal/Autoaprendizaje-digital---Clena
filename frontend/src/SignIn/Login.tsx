// SignIn/Login.tsx

import { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/authContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Estado para probar alternar roles en desarrollo local
  const [selectedRole, setSelectedRole] = useState<'admin' | 'student'>('student');

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 1. Simulación de respuesta de sesión
    const mockUser = {
      email,
      userRole: selectedRole,
    };

    const mockToken = 'mock-jwt-token-12345';

    // 2. Guardar estado global a través del context
    login({
      user: mockUser,
      token: mockToken,
    });

    // 3. Redirección condicional según rol
    if (selectedRole === 'admin') {
      navigate('/Admin');
    } else {
      navigate('/StudentsHome');
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Selector de rol temporal para pruebas locales */}
        <label htmlFor="role">Rol de prueba (Dev):</label>
        <select
          id="role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'student')}
        >
          <option value="student">Estudiante</option>
          <option value="admin">Administrador</option>
        </select>

        <button type="submit">Login</button>
      </form>
    </div>
  );
};