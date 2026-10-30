// Прямой адрес бэкенда FastAPI на порту 8000 с префиксом /api
const BASE_URL = 'http://89.108.76/api'; 

const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); 
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const projectService = {
  
  // 1. Получить все проекты с учетом фильтров
  getAllProjects: async (direction, lang) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Экранируем переменные, чтобы спецсимволы (например, "C#") не ломали URL запроса
    const safeDir = encodeURIComponent(direction);
    const safeLang = encodeURIComponent(lang);

    const response = await fetch(`${BASE_URL}/projects?direction=${safeDir}&lang=${safeLang}`, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) throw new Error('Не удалось загрузить ленту проектов');
    return response.json();
  },

  // 2. Получить проекты залогиненного студента
  getMyProjects: async () => {
    const res = await fetch(`${BASE_URL}/my/projects`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Не удалось загрузить ваши проекты');
    return await res.json();
  },

  // 3. Опубликовать проект (Исправленная версия для отправки фото и видео)
  async createProject(newProjectData) {
    const formData = new FormData();
    
    // Добавляем все текстовые поля
    formData.append('title', newProjectData.title);
    formData.append('shortDesc', newProjectData.shortDesc);
    formData.append('fullDesc', newProjectData.fullDesc || '');
    formData.append('direction', newProjectData.direction);
    formData.append('lang', newProjectData.lang || '');
    formData.append('github', newProjectData.github || '');
    
    // Преобразуем boolean в строку для корректной передачи через FormData
    formData.append('commentsDisabled', newProjectData.commentsDisabled ? 'true' : 'false');
    
    const token = localStorage.getItem('token');
    if (token) {
      formData.append('token', token); 
    }

    // Добавляем файлы в массив (на бэкенде их ожидает аргумент 'files')
    if (newProjectData.mediaFiles && newProjectData.mediaFiles.length > 0) {
      newProjectData.mediaFiles.forEach((file) => {
        formData.append('files', file);
      });
    }

    // Строго шлем запрос на порт 8000 бэкенда в обход Nginx
    const response = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Важно: 'Content-Type' указывать НЕ НАДО, браузер сделает это сам!
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка создания проекта');
    }

    return await response.json();
  },

  // 4. Удалить проект
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

  // 5. Получить комментарии к проекту
  getComments: async (projectId) => {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/projects/${projectId}/comments`, { headers });
    if (!res.ok) throw new Error('Не удалось загрузить комментарии');
    return await res.json();
  },

  // 6. Создать комментарий
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

  // 7. Проголосовать за комментарий (лайк/дизлайк)
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

  // 8. Получить ТОП-5 студентов по рейтингу лайков
  getLeaderboard: async () => {
    const res = await fetch(`${BASE_URL}/users/rating`);
    if (!res.ok) throw new Error('Не удалось загрузить рейтинг ЧРТ');
    return await res.json();
  },

  // 9. Поставить/убрать лайк проекту
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
