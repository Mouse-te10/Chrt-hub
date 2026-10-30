
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
  // Пример того, как должен выглядеть метод внутри вашего projectService.js
  async createProject(newProjectData) {
    const formData = new FormData();
    
    // Добавляем все текстовые поля
    formData.append('title', newProjectData.title);
    formData.append('shortDesc', newProjectData.shortDesc);
    formData.append('fullDesc', newProjectData.fullDesc);
    formData.append('direction', newProjectData.direction);
    formData.append('lang', newProjectData.lang);
    formData.append('github', newProjectData.github);
    formData.append('commentsDisabled', newProjectData.commentsDisabled);
    
    // ЯВНО прикрепляем токен в саму форму для бэкенда!
    const token = localStorage.getItem('token');
    if (token) {
      formData.append('token', token); 
    }

    // Добавляем файлы
    if (newProjectData.mediaFiles) {
      newProjectData.mediaFiles.forEach((file) => {
        formData.append('files', file);
      });
    }

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        // ВАЖНО: При отправке FormData заголовок 'Content-Type' указывать НЕ НАДО, 
        // браузер должен поставить его сам вместе с boundary-разделителями!
        'Authorization': `Bearer ${token}` // оставляем для подстраховки
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Ошибка создания проекта');
    }

    return await response.json();
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

