import './AuthPage.css';

function AuthPage({ onLoginClick, onRegisterClick, onAnonymousClick }) {
  return (
    <div className="auth-page-wrapper">
      {/* Мягкие тусклые круги на заднем плане */}
      <div className="bg-glow glow-top-left"></div>
      <div className="bg-glow glow-bottom-right"></div>

      {/* Основной контент страницы */}
      <div className="auth-page-container">
        
        {/* Фирменный заголовок проекта */}
        <h1 className="auth-title">Chrt-hub</h1>

        <div className="auth-buttons-group">
          
          <button className="auth-choice-button" onClick={onLoginClick}>
            Вход
          </button>

          <button className="auth-choice-button" onClick={onRegisterClick}>
            Регистрация
          </button>

          <button className="auth-choice-button anonymous" onClick={onAnonymousClick}>
            Аноним
          </button>
          
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
