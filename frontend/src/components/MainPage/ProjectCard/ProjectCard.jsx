import './ProjectCard.css';

function ProjectCard({ project, onViewDetails, user, onToggleLike }) { 
  const isDesign = project.direction === 'Дизайн';

  const handleLikeClick = (e) => {
    e.stopPropagation(); // Чтобы не проваливаться на страницу деталей
    if (!user || user.role === 'anonymous') {
      alert('Оценивать проекты могут только авторизованные студенты ЧРТ!');
      return;
    }
    // Вызываем глобальный обработчик лайка вместо локального useState
    if (onToggleLike) {
      onToggleLike(project.id);
    }
  };

  return (
    <article className="project-card-main">
      <div className="card-header-row">
        <h4 className="card-title">{project.title}</h4>
        <div className="card-tags">
          {!isDesign && <span className="badge lang">{project.lang}</span>}
          <span className="badge dir">{project.direction}</span>
        </div>
      </div>

      <p className="card-desc">{project.shortDesc}</p>

      <div className="card-footer-row">
        <div className="card-author">Автор: <span>{project.author}</span></div>
        <div className="card-actions">
          
          <button 
            className={`project-like-btn ${project.hasLiked ? 'active' : ''}`} 
            onClick={handleLikeClick}
          >
            ❤️ {project.likesCount || 0}
          </button>

          <button className="details-btn" onClick={() => onViewDetails(project)}>
            Подробнее
          </button>

          {isDesign ? (
            <button className="gh-btn disabled" disabled>GitHub</button>
          ) : (
            <a href={project.github || "#"} target="_blank" rel="noreferrer" className="gh-btn active">GitHub</a>
          )}
        </div>
      </div>
    </article>
  );
}

export default ProjectCard;
