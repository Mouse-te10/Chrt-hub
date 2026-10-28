// ProjectFilter.jsx
import './ProjectFilter.css';

const DIRECTIONS = ["Все", "Веб-разработка", "Мобильная разработка", "Разработка программ", "Game-dev", "Скрипты", "Дизайн", "Другое"];
const LANGUAGES = ["Все", "Python", "Js", "Ts", "Bash", "C++", "C#", "Java", "Kotlin", "Swift", "php", "rust", "go", "dart"];

function ProjectFilter({ activeDir, setActiveDir, activeLang, setActiveLang }) {
  return (
    <section className="filters-section">
      <div className="filter-row">
        <span className="filter-label">Направление</span>
        <div className="tags-container">
          {DIRECTIONS.map(dir => (
            <button 
              key={dir} 
              className={`tag-btn ${activeDir === dir ? 'active' : ''}`}
              onClick={() => setActiveDir(dir)}
            >
              {dir}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Язык программирования</span>
        <div className="tags-container">
          {LANGUAGES.map(lang => (
            <button 
              key={lang} 
              className={`tag-btn ${activeLang === lang ? 'active' : ''}`}
              onClick={() => setActiveLang(lang)}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProjectFilter;
