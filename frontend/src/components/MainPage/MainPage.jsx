import React, { useState } from 'react';
import Header from './Header/Header';
import SidebarRating from './SidebarRating/SidebarRating';
import ProjectFilter from './ProjectFilter/ProjectFilter';
import ProjectCard from './ProjectCard/ProjectCard';
import ProjectForm from './ProjectForm/ProjectForm';
import Footer from './Footer/Footer';
import './MainPage.css';

function MainPage({ 
  user, 
  setScreen, 
  projects, 
  activeDir, 
  setActiveDir, 
  activeLang, 
  setActiveLang, 
  onAddProject, 
  onToggleLike,
  onViewProjectDetails 
}) {
  const [searchValue, setSearchValue] = useState('');

  // Локальный живой поиск по названию среди уже отфильтрованных бэкендом проектов
  const searchedProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="main-page-root" style={{backgroundColor: 'var(--bg-main)', minHeight: '100vh'}}>
      <Header 
        user={user} 
        searchValue={searchValue} 
        onSearchChange={setSearchValue} 
        setScreen={setScreen} 
        projects={projects}
        onViewProjectDetails={onViewProjectDetails}
        showDropdown={true}
        ViewButtonMyProjects={true}
      />
      
      <div className={`main-layout ${user.role === 'anonymous' ? 'anonymous-view' : ''}`}>
        <SidebarRating refreshTrigger={projects.length} />

        <div className="center-content-flow">
          <ProjectFilter 
            activeDir={activeDir} setActiveDir={setActiveDir} 
            activeLang={activeLang} setActiveLang={setActiveLang} 
          />

          <div className="projects-list-container">
            {searchedProjects.length > 0 ? (
              searchedProjects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  user={user}
                  onViewDetails={onViewProjectDetails} 
                  onToggleLike={onToggleLike}
                />
              ))
            ) : (
              <div style={{color: 'var(--text-muted)', textAlign: 'center', padding: '40px'}}>
                Проектов не найдено на Chrt-Hub.
              </div>
            )}
          </div>
        </div>

        {user.role !== 'anonymous' && (
          <ProjectForm 
            onAddProject={onAddProject} 
            authorName={user.username} 
          />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default MainPage;
