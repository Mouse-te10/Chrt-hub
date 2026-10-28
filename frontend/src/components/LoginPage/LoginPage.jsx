import { useState } from 'react';
import './LoginPage.css';

function LoginPage({ onBack, onSubmitSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert('Заполните все поля!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // Если бэкенд вернул ошибку (401 и т.д.), выводим её текст
        throw new Error(data.detail || 'Ошибка при входе');
      }

      // Сохраняем JWT-токен в localStorage, чтобы сессия не сбрасывалась
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Передаем данные наверх в App.jsx
      onSubmitSuccess(data.user);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="bg-glow glow-top-left"></div>
      <div className="bg-glow glow-bottom-right"></div>

      <div className="login-page-container">
        <h1 className="auth-title">Chrt-hub</h1>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя пользователя</label>
            <input 
              type="text" 
              placeholder="Введите логин" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input 
              type="password" 
              placeholder="Введите ваш пароль" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
          
          <button type="button" className="back-btn" onClick={onBack} disabled={isLoading}>
            ← Назад к выбору
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
