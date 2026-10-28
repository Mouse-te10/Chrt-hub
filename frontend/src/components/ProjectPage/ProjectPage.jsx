import { useState, useEffect } from 'react';
import './ProjectPage.css';
import Header from '../MainPage/Header/Header';
import Footer from '../MainPage/Footer/Footer';
import { projectService } from '../../services/projectService'; // Подключаем сервис

function ProjectPage({ project, currentUsername, onBack, projects, onViewProjectDetails, onOpenMyProjects, user }) {
  const [mediaIndex, setMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [pageSearchValue, setPageSearchValue] = useState('');

  // Заменяем хардкод на динамический стейт из БД
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(true);

  const projectMedia = project?.media && project.media.length > 0 
    ? project.media 
    : ["https://unsplash.com"];

  // Подгружаем комментарии при монтировании страницы или смене ID проекта
  useEffect(() => {
    if (project?.id) {
      loadComments();
    }
  }, [project?.id]);

  const loadComments = async () => {
    try {
      setCommentsLoading(true);
      const data = await projectService.getComments(project.id);
      setComments(data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setCommentsLoading(false);
    }
  };

  const nextMedia = () => setMediaIndex((prev) => (prev === projectMedia.length - 1 ? 0 : prev + 1));
  const prevMedia = () => setMediaIndex((prev) => (prev === 0 ? projectMedia.length - 1 : prev - 1));

  // Реальное голосование через API с оптимистичным обновлением интерфейса
  const handleVote = async (commentId, voteType) => {
    if (user.role === 'anonymous') {
      alert('Голосовать могут только авторизованные студенты ЧРТ!');
      return;
    }

    const isLikeTarget = voteType === 'like';
    
    try {
      // Отправляем запрос на бэк
      await projectService.voteComment(commentId, isLikeTarget);
      // Просто пересобираем комменты из БД, чтобы получить идеальные точные счетчики
      const updatedComments = await projectService.getComments(project.id);
      setComments(updatedComments);
    } catch (err) {
      alert(err.message);
    }
  };

  // Добавление комментария через API
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (user.role === 'anonymous') {
      alert('Анонимы не могут оставлять комментарии. Пожалуйста, войдите в аккаунт!');
      return;
    }
    if (!newCommentText.trim()) return;

    try {
      const createdComment = await projectService.createComment(newCommentText, project.id);
      // Добавляем новый коммент в список локально
      setComments([...comments, createdComment]);
      setNewCommentText('');
    } catch (err) {
      alert(err.message);
    }
  };

  const isDesign = project?.direction === 'Дизайн';

  const authorTotalLikes = projects
    .filter(p => p.author === project?.author)
    .reduce((sum, p) => sum + (p.likesCount || 0), 0);

  return (
    <div className="project-page-root" style={{backgroundColor: 'var(--bg-main)', minHeight: '100vh'}}>
      <div className="bg-glow glow-top-left"></div>
      <div className="bg-glow glow-bottom-right"></div>
      <Header 
        user={user} 
        searchValue={pageSearchValue} 
        onSearchChange={setPageSearchValue} 
        setScreen={(targetScreen) => {
          if (targetScreen === 'my_projects') {
            onOpenMyProjects();
          } else {
            onBack();
          }
        }}
        projects={projects} 
        onViewProjectDetails={onViewProjectDetails} 
        showDropdown={true}
        ViewButtonMyProjects={true}
      />

      <div className="project-sub-header">
        <button className="back-to-hub-btn" onClick={onBack}>
          ← Назад в ленту
        </button>
        {isDesign ? (
          <button className="github-top-btn disabled" disabled>Код недоступен (Дизайн)</button>
        ) : (
          <a href={project?.github || "https://github.com"} target="_blank" rel="noreferrer" className="github-top-btn">
            Перейти на GitHub
          </a>
        )}
      </div>

      <div className="project-details-grid">
        <main className="project-content-left">
          <h2 className="project-main-title">{project?.title || "Название проекта"}</h2>
          <p className="project-long-desc">{project?.fullDesc || project?.shortDesc || "Описание проекта..."}</p>

          <div className="gallery-slider-container">
            <button className="slider-arrow left" onClick={prevMedia}>‹</button>
            <div className="slider-media-window" onClick={() => setIsLightboxOpen(true)}>
              {projectMedia[mediaIndex].includes('video') || (typeof projectMedia[mediaIndex] === 'string' && projectMedia[mediaIndex].endsWith('.mp4')) ? (
                <video src={projectMedia[mediaIndex]} muted autoPlay loop />
              ) : (
                <img src={projectMedia[mediaIndex]} alt="Скриншот проекта" />
              )}
            </div>
            <button className="slider-arrow right" onClick={nextMedia}>›</button>
          </div>

          {/* Блок Комментариев */}
          <section className="project-comments-wrapper">
            <h3 className="comments-block-title">Комментарии ({comments.length})</h3>
            
            {project?.commentsDisabled ? (
              <div style={{color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0'}}>
                Автор отключил комментарии к этому проекту.
              </div>
            ) : commentsLoading ? (
              <div style={{color: 'var(--text-muted)'}}>Загрузка обсуждения...</div>
            ) : (
              <>
                <div className="comments-flow-list">
                  {comments.map((c) => (
                    <div key={c.id} className="comment-node-box">
                      <div className="comment-meta-row">
                        <span>
                          {c.author_name} ({c.author_group}) {c.author_name === currentUsername && <span style={{color: 'var(--accent-mint)'}}>(Вы)</span>}
                        </span>
                      </div>
                      <p className="comment-text-body">{c.text}</p>
                      
                      <div className="comment-actions-bar">
                        <div className="voting-buttons-pack">
                          <button 
                            type="button"
                            className={`vote-action-btn liked ${c.user_vote === true ? 'active' : ''}`}
                            onClick={() => handleVote(c.id, 'like')}
                          >
                            ▲ {c.likes_count}
                          </button>
                          <button 
                            type="button"
                            className={`vote-action-btn disliked ${c.user_vote === false ? 'active' : ''}`}
                            onClick={() => handleVote(c.id, 'dislike')}
                          >
                            ▼ {c.dislikes_count}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div style={{color: 'var(--text-muted)', padding: '10px 0'}}>Будьте первым, кто оставит отзыв!</div>
                  )}
                </div>

                {user.role !== 'anonymous' && (
                  <form className="add-comment-form-block" onSubmit={handleAddComment}>
                    <input 
                      type="text" 
                      placeholder="Напишите ваш отзыв или вопрос по коду..." 
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      maxLength={1000}
                    />
                    <button type="submit">Отправить</button>
                  </form>
                )}
              </>
            )}
          </section>
        </main>

        <aside className="project-author-sidebar">
          <div className="sidebar-heading">Автор проекта</div>
          <div className="author-main-profile">
            <div className="author-huge-name">{project?.author || "Студент ЧРТ"}</div>
            <div className="author-group-tag">Группа: {project?.group_name || "ЧРТ"}</div>
          </div>
          <div className="author-rating-score-box">
            <span style={{ color: 'var(--text-muted)' }}>Рейтинг на хабе:</span>
            {/* Выводим реальный, динамический рейтинг вместо ★ 100 */}
            <span style={{ color: 'var(--accent-mint)', fontWeight: 700 }}>❤️ {authorTotalLikes}</span>
          </div>
          <div className="author-bio-text">
            {project?.authorAbout || "Студент Челябинского Радиотехнического Техникума. Вносит вклад в репозитории комьюнити Chrt-Hub."}
          </div>
        </aside>
      </div>

      {isLightboxOpen && (
        <div className="lightbox-modal-overlay" onClick={() => setIsLightboxOpen(false)}>
          <div className="lightbox-content-box" onClick={e => e.stopPropagation()}>
            <button type="button" className="lightbox-close-top-btn" onClick={() => setIsLightboxOpen(false)}>
              ← Назад
            </button>
            {projectMedia[mediaIndex].includes('video') || (typeof projectMedia[mediaIndex] === 'string' && projectMedia[mediaIndex].endsWith('.mp4')) ? (
              <video src={projectMedia[mediaIndex]} controls autoPlay />
            ) : (
              <img src={projectMedia[mediaIndex]} alt="Увеличенное превью" />
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default ProjectPage;
