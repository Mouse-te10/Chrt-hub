import { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage/AuthPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import LoginPage from './components/LoginPage/LoginPage';
import MainPage from './components/MainPage/MainPage'; 
import ProjectPage from './components/ProjectPage/ProjectPage';
import MyProjectsPage from './components/MyProjectsPage/MyProjectsPage';
import IntroAnim from './components/IntroAnim/IntroAnim';
import { projectService } from './services/projectService'; // Подключаем наш сервис
import './App.css';

const CARDS_DATA = [
  { id: 1, title: "Веб-разработка", desc: "Создавайте адаптивные сайты и сервисы. Интегрируйте фронтенд на React с асинхронным бэкендом." },
  { id: 2, title: "Рейтинг студентов", desc: "Загружайте проекты, собирайте отзывы комьюнити ЧРТ и поднимайтесь в топ лучших." },
  { id: 3, title: "Дизайн & UI/UX", desc: "Удобная демонстрация ваших макетов из Figma, интерфейсов и графических концептов." },
  { id: 4, title: "Game-Dev", desc: "Публикуйте свои игры, скриншоты геймплея и делитесь билдами с другими студентами." },
  { id: 5, title: "Скрипты и Автоматизация", desc: "Пишете полезных ботов на Python или Bash-скрипты? Вашему коду здесь тоже рады." },
  { id: 6, title: "Мобильная разработка", desc: "Показывайте приложения под Android и iOS на Kotlin, Swift, Flutter или React Native." },
  { id: 7, title: "Кибербезопасность", desc: "Проектируйте защиту сетей, тестируйте уязвимости и демонстрируйте навыки аудита информационной безопасности." },
  { id: 8, title: "Базы данных & Big Data", desc: "Оптимизируйте сложные SQL/NoSQL запросы, проектируйте архитектуру хранения данных и анализируйте логи." },
  { id: 9, title: "Сетевые технологии", desc: "Делитесь схемами настройки маршрутизаторов, коммутаторов и конфигурациями виртуальных сетей Cisco." },
  { id: 10, title: "ИИ & Нейросети", desc: "Интегрируйте готовые LLM-модели, пишите алгоритмы машинного обучения и обучайте парсеры на Python." },
  { id: 11, title: "Десктопный софт", desc: "Разрабатывайте полноценные приложения для Windows и Linux на C#, C++, Java или Electron." },
  { id: 12, title: "Embedded & IoT", desc: "Проекты на стыке софта и железа: прошивки для микроконтроллеров Arduino, STM32 и систем умного дома." }
];


function App() {
  // Экраны: 'welcome' | 'auth_choice' | 'login' | 'register' | 'main_page'
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [currentIndex, setCurrentIndex] = useState(0);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { role: 'anonymous', username: 'аноним', projectCount: 0 };
  });

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null); 
  const [showIntro, setShowIntro] = useState(true);

  const [activeDir, setActiveDir] = useState('Все');
  const [activeLang, setActiveLang] = useState('Все');

  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentScreen('main_page');
    }
  }, []);

    useEffect(() => {
    if (currentScreen === 'main_page' || currentScreen === 'project_detail' || currentScreen === 'my_projects') {
      const loadAllProjects = async () => {
        try {
          const data = await projectService.getAllProjects(activeDir, activeLang);
          setProjects(data);
          
          if (user.role !== 'anonymous') {
            // Считаем СУММУ ЛАЙКОВ на всех проектах, где автором является текущий пользователь
            const totalLikesReceived = data
              .filter(p => p.author === user.username)
              .reduce((sum, p) => sum + (p.likesCount || 0), 0);

            setUser(prev => ({ ...prev, projectCount: totalLikesReceived }));
          }
        } catch (err) {
          console.error(err.message);
        }
      };
      loadAllProjects();
    }
  }, [currentScreen, activeDir, activeLang, user.username]);


  const handleAuthSuccess = (userData) => {
    const loggedUser = {
      role: 'student',
      username: userData.username,
      // Берём реальное значение из ответа бэкенда (с защитным дефолтом 0)
      projectCount: userData.project_count || 0, 
      about: userData.about || '',
      group_name: userData.group_name
    };
    setUser(loggedUser);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setCurrentScreen('main_page');
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser({ role: 'anonymous', username: 'аноним', projectCount: 0 });
    setCurrentScreen('auth_choice');
  };
  

  // Переход 2: Студент нажал кнопку "Аноним"
  const handleAnonymousTransition = () => {
    setUser({ role: 'anonymous', username: 'аноним', projectCount: 0 });
    setCurrentScreen('main_page');
  };

  const handleAddProject = async (newProjectData) => {
    try {
      const savedProject = await projectService.createProject(newProjectData);
      setProjects(prev => [savedProject, ...prev]);
      setUser(prev => ({ ...prev })); 
      alert('Проект успешно опубликован на Chrt-Hub!');
    } catch (err) {
      alert(err.message);
    }
  };

  // Метод удаления проекта через API
  const handleApiDeleteProject = async (id) => {
    try {
      await projectService.deleteProject(id);
      // Фильтруем массив удаляя проект
      const updatedProjects = projects.filter(p => p.id !== id);
      setProjects(updatedProjects);

      // Пересчитываем точную сумму лайков по оставшимся проектам автора
      if (user.role !== 'anonymous') {
        const totalLikesReceived = updatedProjects
          .filter(p => p.author === user.username)
          .reduce((sum, p) => sum + (p.likesCount || 0), 0);
        setUser(prev => ({ ...prev, projectCount: totalLikesReceived }));
      }
    } catch (err) {
      alert(err.message);
    }
  };
    const handleToggleLike = async (projectId) => {
    try {
      await projectService.toggleProjectLike(projectId);
      
      // Обновляем состояние проекта прямо в глобальном массиве проектов
      setProjects(prevProjects => {
        const updated = prevProjects.map(p => {
          if (p.id === projectId) {
            const hasLikedNow = !p.hasLiked;
            return {
              ...p,
              hasLiked: hasLikedNow,
              // Магическая защита: если значение undefined или строка, приводим к числу
              likesCount: hasLikedNow 
                ? (Number(p.likesCount) || 0) + 1 
                : Math.max(0, (Number(p.likesCount) || 0) - 1)
            };
          }
          return p;
        });

        // Сразу же пересчитываем суммарный рейтинг текущего пользователя в шапке
        if (user.role !== 'anonymous') {
          const totalLikesReceived = updated
            .filter(p => p.author === user.username)
            .reduce((sum, p) => sum + (Number(p.likesCount) || 0), 0);
          setUser(prev => ({ ...prev, projectCount: totalLikesReceived }));
        }

        return updated;
      });
    } catch (err) {
      alert(`Ошибка изменения лайка: ${err.message}`);
    }
  };




  // Таймер приветственного слайдера
  useEffect(() => {
    if (currentScreen !== 'welcome') return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = CARDS_DATA.length - 3;
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [currentScreen]);

  return (
    <>
      {showIntro && <IntroAnim onAnimComplete={() => setShowIntro(false)} />}
      {/* 1. ЭКРАН ПРИВЕТСТВИЯ */}
      {!showIntro && currentScreen === 'welcome' && (
        <main className="welcome-container">
          <h1 className="welcome-title">Chrt-hub</h1>
          <p className="welcome-description">
            Локальная форма для студентов и преподавателей Челябинского Радиотехнического Техникума. 
            Публикуйте свои лучшие веб-сервисы, десктопные приложения, игры и дизайн-концепты.
          </p>
          <button className="start-button" onClick={() => setCurrentScreen('auth_choice')}>
            Начать!
          </button>
          
          <div className="slider-wrapper">
            <div 
              className="slider-track"
              style={{ transform: `translateX(calc(-${currentIndex * (100 / 3)}% - ${currentIndex * 8}px))` }}
            >
              {CARDS_DATA.map((card) => (
                <article key={card.id} className="preview-card">
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* 2. ЭКРАН ВЫБОРА (Вход / Регистрация / Аноним) */}
      {!showIntro && currentScreen === 'auth_choice' && (
        <AuthPage 
          onLoginClick={() => setCurrentScreen('login')}
          onRegisterClick={() => setCurrentScreen('register')}
          onAnonymousClick={handleAnonymousTransition}
        />
      )}

      {!showIntro && currentScreen === 'login' && (
        <LoginPage onBack={() => setCurrentScreen('auth_choice')} onSubmitSuccess={handleAuthSuccess} />
      )}

      {!showIntro && currentScreen === 'register' && (
        <RegisterPage onBack={() => setCurrentScreen('auth_choice')} onSubmitSuccess={handleAuthSuccess} />
      )}

      {!showIntro && currentScreen === 'main_page' && (
        <MainPage 
          user={user} 
          setScreen={(screen) => screen === 'auth_choice' ? handleLogout() : setCurrentScreen(screen)}
          projects={projects}
          // Прокидываем управление фильтрами наверх в App.jsx для триггера useEffect fetch-запросов
          activeDir={activeDir} setActiveDir={setActiveDir}
          activeLang={activeLang} setActiveLang={setActiveLang}
          onAddProject={handleAddProject}
          onToggleLike={handleToggleLike}
          onViewProjectDetails={(project) => {
            // Берем самую актуальную версию проекта из общего стейта, 
            // чтобы подтянулись только что поставленные лайки
            const freshProject = projects.find(p => p.id === project.id) || project;
            setSelectedProject(freshProject);
            setCurrentScreen('project_detail');
          }}
        />
      )}

      {!showIntro && currentScreen === 'project_detail' && (
        <ProjectPage 
          project={selectedProject} 
          projects={projects} 
          currentUsername={user.username}
          user={user}
          onBack={() => setCurrentScreen('main_page')}
          onViewProjectDetails={(nextProject) => setSelectedProject(nextProject)} 
          onOpenMyProjects={() => setCurrentScreen('my_projects')}
        />
      )}

      {!showIntro && currentScreen === 'my_projects' && (
        <MyProjectsPage 
          user={user} 
          projects={projects} 
          onBack={() => setCurrentScreen('main_page')} 
          onDeleteProject={handleApiDeleteProject}
          onViewProjectDetails={(project) => {
            setSelectedProject(project);
            setCurrentScreen('project_detail');
          }}
        />
      )}
    </>
  );
}

export default App;
