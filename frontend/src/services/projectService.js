const BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); // Синхронизировано с LoginPage/RegisterPage
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const projectService = {
  // Получить все проекты с учетом фильтров
      // Получить все проекты с учетом фильтров (Исправлено экранирование спецсимволов)
  getAllProjects: async (direction, lang) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Экранируем переменные с помощью encodeURIComponent
    // Теперь "C#" превратится в безопасный "C%23", и решетка не отрежется браузером!
    const safeDir = encodeURIComponent(direction);
    const safeLang = encodeURIComponent(lang);

    const response = await fetch(`/api/projects?direction=${safeDir}&lang=${safeLang}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) throw new Error('Не удалось загрузить ленту проектов');
    return response.json();
  },



  // Получить проекты залогиненного студента
  getMyProjects: async () => {
    const res = await fetch(`${BASE_URL}/my/projects`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Не удалось загрузить ваши проекты');
    return await res.json();
  },

    // Опубликовать проект (теперь с реальными файлами)
    // Опубликовать проект (Исправленная версия)
  createProject: async (projectData) => {
    const formData = new FormData();
    
    // Переносим текстовые поля формы в FormData
    formData.append('title', projectData.title);
    formData.append('shortDesc', projectData.shortDesc);
    formData.append('fullDesc', projectData.fullDesc || '');
    formData.append('direction', projectData.direction);
    formData.append('lang', projectData.lang || '');
    formData.append('github', projectData.github || '');
    
    // Передаем boolean как строку 'true' / 'false' для корректной работы FormData
    formData.append('commentsDisabled', projectData.commentsDisabled ? 'true' : 'false');

    // ДОБАВЛЯЕМ ФАЙЛЫ ПРАВИЛЬНО
    if (projectData.mediaFiles && projectData.mediaFiles.length > 0) {
      projectData.mediaFiles.forEach(file => {
        // Так как projectData.mediaFiles — это теперь массив чистых File (а не объектов),
        // мы добавляем в FormData напрямую сам элемент цикла `file`
        if (file) {
          formData.append('files', file); 
        }
      });
    }

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: headers, 
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      // Извлекаем детальную ошибку от FastAPI, если она есть
      const detailMessage = typeof err.detail === 'string' 
        ? err.detail 
        : (err.detail?.[0]?.msg || 'Ошибка при публикации проекта с медиа');
      throw new Error(detailMessage);
    }
    return await res.json();
  },


  // Удалить проект
  deleteProject: async (id) => {
    const res = await fetch(`${BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Не удалось удалить проект');
    }
    return true;
  },
    // Получить комментарии к проекту
  getComments: async (projectId) => {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/projects/${projectId}/comments`, { headers });
    if (!res.ok) throw new Error('Не удалось загрузить комментарии');
    return await res.json();
  },

  // Создать комментарий
  createComment: async (text, projectId) => {
    const res = await fetch(`${BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ text, project_id: projectId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Не удалось отправить комментарий');
    }
    return await res.json();
  },

  // Проголосовать (лайк/дизлайк)
  voteComment: async (commentId, isLike) => {
    const res = await fetch(`${BASE_URL}/comments/${commentId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ is_like: isLike }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Не удалось проголосовать');
    }
    return await res.json();
  },
    // Получить ТОП-5 студентов по количеству проектов
  getLeaderboard: async () => {
    const res = await fetch(`${BASE_URL}/users/rating`);
    if (!res.ok) throw new Error('Не удалось загрузить рейтинг ЧРТ');
    return await res.json();
  },
  toggleProjectLike: async (projectId) => {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/like`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      const detailMessage = typeof err.detail === 'string' 
        ? err.detail 
        : (Array.isArray(err.detail) ? err.detail[0]?.msg : 'Не удалось поставить лайк');
      throw new Error(detailMessage);
    }
    return await res.json();
  },

};

