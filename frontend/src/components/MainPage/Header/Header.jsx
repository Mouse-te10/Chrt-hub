import { useState, useRef, useEffect } from 'react';
import './Header.css';

// Добавили пропс showDropdown в аргументы функции
function Header({ user, onSearchChange, searchValue, setScreen, projects, onViewProjectDetails, showDropdown = false, ViewButtonMyProjects }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Фильтруем проекты для подсказок только если включен флаг showDropdown
  const searchSuggestions = showDropdown && projects && searchValue.trim() !== ''
    ? projects.filter(p => p.title.toLowerCase().includes(searchValue.toLowerCase()))
    : [];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (project) => {
    setIsDropdownOpen(false);
    onSearchChange(''); 
    if (onViewProjectDetails) {
      onViewProjectDetails(project); 
    }
  };

  return (
    <header className="main-header">
      <div className="header-left">
        {ViewButtonMyProjects && (
          user.role !== 'anonymous' ? (
            <button className="my-projects-btn" onClick={() => setScreen('my_projects')}>
              Мои проекты
            </button>
          ) : (
            <span className='user-badge'>Аноним</span>
          )
        )}

        
        {user.role === 'anonymous' ? (
          <div className="search-container anon" ref={dropdownRef}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Быстрый поиск проектов..." 
              value={searchValue}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
            />

            {/* МЕНЮ ВЫЕДЕТ ТОЛЬКО ЕСЛИ ОНО РАЗРЕШЕНО ФЛАГОМ */}
            {showDropdown && isDropdownOpen && searchSuggestions.length > 0 && (
              <div className="search-autocomplete-dropdown">
                {searchSuggestions.map(project => (
                  <div 
                    key={project.id} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(project)}
                  >
                    <div className="suggestion-info">
                      <span className="suggestion-title">{project.title}</span>
                      <span className="suggestion-author">от {project.author}</span>
                    </div>
                    <span className="suggestion-tag">{project.direction}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ЗАГЛУШКА ВЫЕДЕТ ТОЛЬКО ЕСЛИ ОНО РАЗРЕШЕНО ФЛАГОМ */}
            {showDropdown && isDropdownOpen && searchValue.trim() !== '' && searchSuggestions.length === 0 && (
              <div className="search-autocomplete-dropdown empty-result">
                Ничего не найдено
              </div>
            )}
          </div>
        ) : (
          <div className="search-container" ref={dropdownRef}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Быстрый поиск проектов..." 
              value={searchValue}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
            />

            {/* МЕНЮ ВЫЕДЕТ ТОЛЬКО ЕСЛИ ОНО РАЗРЕШЕНО ФЛАГОМ */}
            {showDropdown && isDropdownOpen && searchSuggestions.length > 0 && (
              <div className="search-autocomplete-dropdown">
                {searchSuggestions.map(project => (
                  <div 
                    key={project.id} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(project)}
                  >
                    <div className="suggestion-info">
                      <span className="suggestion-title">{project.title}</span>
                      <span className="suggestion-author">от {project.author}</span>
                    </div>
                    <span className="suggestion-tag">{project.direction}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ЗАГЛУШКА ВЫЕДЕТ ТОЛЬКО ЕСЛИ ОНО РАЗРЕШЕНО ФЛАГОМ */}
            {showDropdown && isDropdownOpen && searchValue.trim() !== '' && searchSuggestions.length === 0 && (
              <div className="search-autocomplete-dropdown empty-result">
                Ничего не найдено
              </div>
            )}
          </div>
        )}
        
      </div>
{/* ... далее весь код кнопок авторизации в Header.jsx идет без изменений ... */}


            <div className="header-right">
        {user.role === 'anonymous' || user.username === 'аноним' ? (
          <>
            <button className="auth-nav-btn" onClick={() => setScreen('login')}>Войти</button>
            <button className="auth-nav-btn" onClick={() => setScreen('register')}>Регистрация</button>
          </>
        ) : (
          <>
            <span className="user-badge">
              {user.username} 
              {/* Добавляем оператор || 0 для защиты от undefined при перезагрузке страницы */}
              <span>{user.projectCount || 0}</span>
            </span>
            <button className="logout-btn" onClick={() => setScreen('auth_choice')}>Выйти</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
