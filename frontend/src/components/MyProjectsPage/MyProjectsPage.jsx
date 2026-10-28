import { useState } from 'react';
import Header from '../MainPage/Header/Header';
import Footer from '../MainPage/Footer/Footer';
import ProjectFilter from '../MainPage/ProjectFilter/ProjectFilter';
import ProjectCard from '../MainPage/ProjectCard/ProjectCard'; // Импортируем правильный компонент
import './MyProjectsPage.css';

function MyProjectsPage({ user, projects, onBack, onDeleteProject, onViewProjectDetails, onToggleLike }) {
  const [searchValue, setSearchValue] = useState('');
  const [activeDir, setActiveDir] = useState('Все');
  const [activeLang, setActiveLang] = useState('Все');

  // Фильтруем проекты: только текущего автора + живой поиск + теги
  const myFilteredProjects = projects.filter(p => {
    const isOwn = p.author === user.username;
    const matchesSearch = p.title.toLowerCase().includes(searchValue.toLowerCase());
    const matchesDir = activeDir === 'Все' || p.direction === activeDir;
    const matchesLang = activeLang === 'Все' || p.lang.toLowerCase() === activeLang.toLowerCase();
    return isOwn && matchesSearch && matchesDir && matchesLang;
  });

  return (
    <div className="my-projects-wrapper">
      <div className="bg-glow glow-top-left"></div>
      <div className="bg-glow glow-bottom-right"></div>
      
      {/* 1. ШАПКА */}
      <Header 
        user={user} 
        searchValue={searchValue} 
        onSearchChange={setSearchValue} 
        setScreen={onBack} 
        projects={projects}
        onViewProjectDetails={onViewProjectDetails}
        ViewButtonMyProjects={false}
      />
      
      {/* 2. ОСНОВНАЯ СЕТКА GRID */}
      <div className="main-layout">
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <aside className="back-row-margin">
          <button className="back-to-hub-btn" onClick={onBack}>
            ← Назад в ленту
          </button>
        </aside>

        {/* ЦЕНТРАЛЬНАЯ КОЛОНКА */}
        <div className="center-content-flow">
          <ProjectFilter 
            activeDir={activeDir} setActiveDir={setActiveDir} 
            activeLang={activeLang} setActiveLang={setActiveLang} 
          />

          <div className="projects-list-container">
            {myFilteredProjects.length > 0 ? (
              myFilteredProjects.map(project => (
                <div key={project.id} className="my-project-card-container" style={{ position: 'relative' }}>
                  {/* Рендерим безопасный компонент без хуков внутри цикла */}
                  <ProjectCard 
                    project={project} 
                    user={user} 
                    onViewDetails={onViewProjectDetails} 
                    onToggleLike={onToggleLike}
                  />
                  
                  {/* Кнопка "Удалить" аккуратно накладывается поверх нижней панели карточки */}
                  <button 
                    className="comment-trash-delete-btn" 
                    style={{ 
                      position: 'absolute', 
                      bottom: '28px', 
                      left: '180px', // Выравнивание кнопки удаления рядом с "Подробнее"
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ff6b6b',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      zIndex: 5
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Удалить проект "${project.title}"?`)) {
                        onDeleteProject(project.id);
                      }
                    }}
                  >
                    Удалить
                  </button>
                </div>
              ))
            ) : (
              <div style={{color: 'var(--text-muted)', textAlign: 'center', padding: '40px'}}>
                У вас пока нет проектов в этой категории.
              </div>
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <aside className="project-author-sidebar">
          <div className="sidebar-heading">Ваш профиль</div>
          
          <div className="author-main-profile">
            <div className="author-huge-name">{user.username}</div>
            <div className="author-group-tag">Студент ЧРТ</div>
          </div>

          <div className="author-rating-score-box">
            <span style={{ color: 'var(--text-muted)' }}>Ваш рейтинг:</span>
            <span style={{ color: 'var(--accent-mint)', fontWeight: 700 }}>★ {user.projectCount || 0}</span>
          </div>

          <div className="author-bio-text">
            {user.about || "Информация о навыках и стеке технологий не заполнена."}
          </div>
        </aside>

      </div>

      {/* 3. ПОДВАЛ */}
      <Footer />
    </div>
  );
}

export default MyProjectsPage;
