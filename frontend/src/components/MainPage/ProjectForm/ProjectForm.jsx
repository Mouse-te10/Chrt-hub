import { useState, useRef } from 'react';
import './ProjectForm.css';

function ProjectForm({ onAddProject, authorName }) {
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [direction, setDirection] = useState('Веб-разработка');
  const [lang, setLang] = useState('Python');
  const [github, setGithub] = useState('');
  const [disableComments, setDisableComments] = useState(false);
  
  // Состояние для хранения выбранных медиафайлов
  const [mediaFiles, setMediaFiles] = useState([]);
  const fileInputRef = useRef(null);

  // === ДОБАВЛЕННАЯ ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ СТЕЙТА ===
  const addFileToState = (file) => {
    const fileType = file.type.startsWith('video/') ? 'video' : 'image';
    const newFileObject = {
      raw: file, // Храним оригинальный файл для отправки на бэк
      type: fileType,
      preview: URL.createObjectURL(file) // Создаем временную ссылку для тегов <img> / <video>
    };
    setMediaFiles(prev => [...prev, newFileObject]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Проверка 1: Лимит на общее количество (до 10 штук суммарно)
    if (mediaFiles.length + files.length > 10) {
      alert('Максимальное количество медиафайлов (фото + видео) — 10 штук!');
      return;
    }

    files.forEach(file => {
      // Проверка 2: Если это видео, проверяем его длину
      if (file.type.startsWith('video/')) {
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        
        videoElement.onloadedmetadata = () => {
          window.URL.revokeObjectURL(videoElement.src);
          // Длина видео не должна превышать 30 секунд
          if (videoElement.duration > 30) {
            alert(`Видео "${file.name}" превышает лимит в 30 секунд! Загрузка отменена.`);
          } else {
            addFileToState(file);
          }
        };
        videoElement.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('image/')) {
        // Если это фото, добавляем сразу
        addFileToState(file);
      } else {
        alert('Разрешено загружать только фотографии и видеофайлы!');
      }
    });

    // Сбрасываем значение инпута, чтобы можно было выбрать тот же файл повторно
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    const fileToRemove = mediaFiles[index];
    if (fileToRemove && fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!title || !shortDesc) {
      alert('Заполните название и краткое описание!');
      return;
    }

    // Извлекаем массив чистых файлов `raw` (File) для отправки на сервер
    const rawFilesToSend = mediaFiles.map(f => f.raw);

    onAddProject({
      title: title,
      shortDesc: shortDesc,
      fullDesc: fullDesc || shortDesc,
      direction: direction,
      lang: direction === 'Дизайн' ? 'Дизайн' : lang,
      github: direction === 'Дизайн' ? '' : github || 'https://github.com',
      commentsDisabled: disableComments,
      mediaFiles: rawFilesToSend // Передаем наверх именно файлы, а не объекты с Blob-ссылками
    });

    // Очищаем Blob-ссылки во избежание утечек памяти
    mediaFiles.forEach(fileObj => {
      if (fileObj.preview) URL.revokeObjectURL(fileObj.preview);
    });

    // Полная очистка формы
    setTitle('');
    setShortDesc('');
    setFullDesc('');
    setGithub('');
    setMediaFiles([]);
  };

  return (
    <aside className="project-form-sidebar">
      <h3 className="form-title">форма</h3>
      <form className="mini-form" onSubmit={handleFormSubmit}>
        <input type="text" placeholder="Название проекта" value={title} onChange={e => setTitle(e.target.value)} />
        <input type="text" placeholder="Краткое описание" value={shortDesc} onChange={e => setShortDesc(e.target.value)} />
        <textarea placeholder="Полное описание" rows="2" value={fullDesc} onChange={e => setFullDesc(e.target.value)}></textarea>
        <input type="text" placeholder="Ссылка на GitHub (если есть)" value={github} onChange={e => setGithub(e.target.value)} disabled={direction === 'Дизайн'} />
        
        <select value={direction} onChange={e => setDirection(e.target.value)}>
          <option value="Веб-разработка">Веб-разработка</option>
          <option value="Мобильная разработка">Мобильная разработка</option>
          <option value="Разработка программ">Разработка программ</option>
          <option value="Game-dev">Game-dev</option>
          <option value="Скрипты">Скрипты</option>
          <option value="Дизайн">Дизайн</option>
          <option value="Другое">Другое</option>
        </select>

        <select value={lang} onChange={e => setLang(e.target.value)} disabled={direction === 'Дизайн'}>
          <option value="Python">Python</option>
          <option value="Js">Js</option>
          <option value="Ts">Ts</option>
          <option value="Bash">Bash</option>
          <option value="C++">C++</option>
          <option value="C#">C#</option>
        </select>

        {/* СЕКЦИЯ: Загрузка медиафайлов */}
        <div className="media-upload-section">
          <button type="button" className="upload-trigger-btn" onClick={() => fileInputRef.current.click()}>
            📎 Прикрепить фото/видео ({mediaFiles.length}/10)
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            multiple 
            accept="image/*,video/*" 
            onChange={handleFileChange} 
          />
          
          {/* Сетка превьюшек */}
          {mediaFiles.length > 0 && (
            <div className="form-media-preview-grid">
              {mediaFiles.map((file, idx) => (
                <div key={idx} className="preview-item-box">
                  {file.type === 'video' ? (
                    <video src={file.preview} muted playsInline />
                  ) : (
                    <img src={file.preview} alt="" />
                  )}
                  <button type="button" className="delete-media-btn" onClick={() => removeFile(idx)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="checkbox-group">
          <input type="checkbox" checked={disableComments} onChange={e => setDisableComments(e.target.checked)} />
          комментарии отключить
        </label>

        <button type="submit" className="submit-project-btn">отправить</button>
      </form>
    </aside>
  );
}

export default ProjectForm;
