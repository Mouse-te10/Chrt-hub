import React, { useState, useEffect } from 'react';
import { projectService } from '../../../services/projectService';
import './SidebarRating.css';

function SidebarRating({ refreshTrigger }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Подгружаем рейтинг при монтировании и при триггере (например, создании/удалении проекта)
  useEffect(() => {
    const loadRating = async () => {
      try {
        const data = await projectService.getLeaderboard();
        setLeaders(data);
      } catch (err) {
        console.error('Ошибка рейтинга:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadRating();
  }, [refreshTrigger]);

  return (
    <aside className="rating-sidebar">
      <h3 className="rating-title">Рейтинг</h3>
      <div className="rating-list">
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Загрузка топа...</div>
        ) : leaders.length > 0 ? (
          leaders.map((student, i) => (
            <div key={i} className="rating-item">
              <span className="user-name">{student.name}</span>
              <span className="user-score">{student.count}</span>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Пусто</div>
        )}
      </div>
    </aside>
  );
}

export default SidebarRating;
