import { useState } from 'react';
import './RegisterPage.css';

const CHRT_GROUPS = [
  { value: "РК3-179", label: "РК3-179" }, { value: "РК3-277", label: "РК3-277" },
  { value: "Р3-178", label: "Р3-178" }, { value: "Р3-276", label: "Р3-276" },
  { value: "Ис-103", label: "Ис-103" }, { value: "Кб-102", label: "Кб-102" },
  { value: "Кб-105", label: "Кб-105" }, { value: "Пр-104", label: "Пр-104" },
  { value: "Пр-199", label: "Пр-199" }, { value: "Рк-101", label: "Рк-101" },
  { value: "Рт-196", label: "Рт-196" }, { value: "Рт-197", label: "Рт-197" },
  { value: "Са-198", label: "Са-198" }, { value: "Ис-293", label: "Ис-293" },
  { value: "Кб-292", label: "Кб-292" }, { value: "Кб-295", label: "Кб-295" },
  { value: "Пр-290", label: "Пр-290" }, { value: "Пр-294", label: "Пр-294" },
  { value: "Рк-291", label: "Рк-291" }, { value: "Рт-287", label: "Рт-287" },
  { value: "Рт-288", label: "Рт-288" }, { value: "Са-289", label: "Са-289" },
  { value: "Ис-381", label: "Ис-381" }, { value: "Кб-384", label: "Кб-384" },
  { value: "Кб-386", label: "Кб-386" }, { value: "Пр-382", label: "Пр-382" },
  { value: "Рк-383", label: "Рк-383" }, { value: "Рр-385", label: "Рр-385" },
  { value: "Рт-379", label: "Рт-379" }, { value: "Са-380", label: "Са-380" },
  { value: "Ис-472", label: "Ис-472" }, { value: "Ис-477", label: "Ис-477" },
  { value: "Кб-475", label: "Кб-475" }, { value: "Кб-478", label: "Кб-478" },
  { value: "Пр-473", label: "Пр-473" }, { value: "Рт-470", label: "Рт-470" },
  { value: "Рт-476", label: "Рт-476" }, { value: "Са-471", label: "Са-471" }
];

function RegisterPage({ onBack, onSubmitSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [group, setGroup] = useState('');
  const [about, setAbout] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !group) {
      alert('Пожалуйста, заполните обязательные поля!');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Шаг первый — шлем запрос на регистрацию
      const regResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, group_name: group, about })
      });

      const regData = await regResponse.json();

      if (!regResponse.ok) {
        throw new Error(regData.detail || 'Ошибка при регистрации');
      }

      // 2. Шаг второй — если регистрация прошла успешно, сразу автоматически делаем логин
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        localStorage.setItem('token', loginData.access_token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        onSubmitSuccess(loginData.user);
      } else {
        alert('Аккаунт создан, но автоматический вход не удался. Попробуйте войти вручную.');
        onBack();
      }

    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="bg-glow glow-top-left"></div>
      <div className="bg-glow glow-bottom-right"></div>

      <div className="register-page-container">
        <h1 className="auth-title">Chrt-hub</h1>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя пользователя *</label>
            <input 
              type="text" 
              placeholder="Придумайте логин" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Пароль *</label>
            <input 
              type="password" 
              placeholder="Минимум 6 символов" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Учебная группа *</label>
            <select value={group} onChange={(e) => setGroup(e.target.value)} disabled={isLoading}>
              <option value="">Выберите вашу группу</option>
              {CHRT_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>О себе (необязательно)</label>
            <textarea 
              placeholder="Расскажите о своих навыках или стеке технологий..." 
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Создание аккаунта...' : 'Создать аккаунт'}
          </button>
          
          <button type="button" className="back-btn" onClick={onBack} disabled={isLoading}>
            ← Назад к выбору
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
