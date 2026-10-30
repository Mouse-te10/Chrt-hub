from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import engine, get_db
from app.models import Base, Project, User
from app.schemas import UserCreate, UserResponse, UserLogin, Token
from app.auth import hash_password, verify_password, create_access_token
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import selectinload
from app.auth import SECRET_KEY, ALGORITHM
from app.models import Comment, CommentVote
from app.schemas import CommentCreate, CommentResponse, VoteRequest
from sqlalchemy.sql import func
from fastapi import Request  # Убедись, что Request импортирован в самом верху файла
import os
import shutil
from uuid import uuid4
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func
from app.models import ProjectLike
from sqlalchemy import distinct

app = FastAPI(title="Chrt-Hub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://89.108.76.180", "http://89.108.76.180:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/api/health", tags=["System"])
async def health_check():
    return {"status": "working", "database": "connected"}


# ================= ЭНДПОИНТ: РЕГИСТРАЦИЯ СТУДЕНТА =================
@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
async def register_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Проверяем, нет ли уже пользователя с таким логином в базе
    result = await db.execute(select(User).where(User.username == user_data.username))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже зарегистрирован в ЧРТ!"
        )
    
    # Хэшируем пароль и создаем запись в PostgreSQL
    new_user = User(
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        group_name=user_data.group_name,
        about=user_data.about
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


# ================= ЭНДПОИНТ: ВХОД В АККАУНТ (LOGIN) =================
@app.post("/api/auth/login", response_model=Token, tags=["Auth"])
async def login_user(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    # Ищем пользователя по логину
    result = await db.execute(select(User).where(User.username == login_data.username))
    user = result.scalars().first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль!"
        )
    
    # Считаем, сколько проектов у этого пользователя уже есть в базе данных
    count_result = await db.execute(select(func.count(Project.id)).where(Project.author_id == user.id))
    project_count = count_result.scalar() or 0
    
    # Динамически добавляем это свойство в объект user перед отправкой, чтобы Pydantic-схема его сожрала
    user.project_count = project_count
    
    access_token = create_access_token(data={"sub": user.username, "user_id": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Зависимость для извлечения текущего пользователя из JWT
async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось валидировать учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        if username is None or user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user


# ================= ЭНДПОИНТ: ПОЛУЧЕНИЕ ВСЕХ ПРОЕКТОВ (ОПТИМИЗИРОВАННЫЙ) =================
@app.get("/api/projects", tags=["Projects"])
async def get_all_projects(direction: str = "Все", lang: str = "Все", request: Request = None, db: AsyncSession = Depends(get_db)):
    # Безопасно извлекаем user_id из JWT-токена
    user_id = None
    auth_header = request.headers.get("Authorization") if request else None
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
        except:
            pass

    # 1. Создаем изолированный подзапрос для подсчета лайков (избавляет от гигантских group_by)
    likes_subquery = (
        select(
            ProjectLike.project_id,
            func.count(ProjectLike.id).label("likes_count")
        )
        .group_by(ProjectLike.project_id)
        .subquery()
    )

    # 2. Основной запрос: соединяем проект, автора и наш подзапрос лайков
    query = (
        select(
            Project,
            func.coalesce(likes_subquery.c.likes_count, 0).label("likes_count")
        )
        .options(selectinload(Project.author))
        .join(likes_subquery, Project.id == likes_subquery.c.project_id, isouter=True)
    )
    
    # Фильтрация по направлению
    if direction != "Все":
        query = query.where(Project.direction == direction)
        
    # Безопасная фильтрация по языку программирования (с защитой от None / null в БД)
    if lang != "Все":
        query = query.where(
            Project.lang.isnot(None),
            func.lower(Project.lang) == lang.lower()
        )
    
    result = await db.execute(query.order_by(Project.id.desc()))
    rows = result.all()
    
    response_data = []
    for row in rows:
        p = row[0]          # Объект Project
        likes_cnt = row[1]  # Гарантированное число лайков из подзапроса
        
        # Проверяем, лайкнул ли проект именно этот залогиненный студент
        has_liked = False
        if user_id:
            like_check = await db.execute(
                select(ProjectLike).where(ProjectLike.user_id == user_id, ProjectLike.project_id == p.id)
            )
            has_liked = like_check.scalars().first() is not None

        response_data.append({
            "id": p.id,
            "title": p.title,
            "shortDesc": p.short_desc,
            "fullDesc": p.full_desc,
            "direction": p.direction,
            "lang": p.lang,
            "github": p.github,
            "commentsDisabled": p.comments_disabled,
            "author": p.author.username,
            "author_id": p.author_id,
            "group_name": p.author.group_name,
            "media": p.media_urls,
            "likesCount": int(likes_cnt),  # Приводим к чистому Int
            "hasLiked": has_liked
        })
        
    return response_data




@app.get("/api/my/projects", tags=["Projects"])
@app.get("/api/my/projects/", tags=["Projects"])
async def get_my_projects(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = (
        select(
            Project,
            func.count(ProjectLike.id).label("likes_count")
        )
        .options(selectinload(Project.author))
        .join(ProjectLike, Project.id == ProjectLike.project_id, isouter=True)
        .where(Project.author_id == current_user.id)
        .group_by(Project.id)
        .order_by(Project.id.desc())
    )
    result = await db.execute(query)
    rows = result.all()
    
    response_data = []
    for row in rows:
        p, likes_cnt = row[0], row[1]
        
        # Сам свой проект юзер вряд ли проверяет на "лайкнутость", но для консистентности вернем True/False
        like_check = await db.execute(
            select(ProjectLike).where(ProjectLike.user_id == current_user.id, ProjectLike.project_id == p.id)
        )
        has_liked = like_check.scalars().first() is not None

        response_data.append({
            "id": p.id,
            "title": p.title,
            "shortDesc": p.short_desc,
            "fullDesc": p.full_desc,
            "direction": p.direction,
            "lang": p.lang,
            "github": p.github,
            "commentsDisabled": p.comments_disabled,
            "author": p.author.username,
            "author_id": p.author_id,
            "media": p.media_urls,
            "likesCount": likes_cnt,
            "hasLiked": has_liked
        })
    return response_data


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

# Константы для валидации файлов (добавьте перед эндпоинтом или в начало файла)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 Мегабайт
MAX_FILES_COUNT = 10
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"]

# ================= ЭНДПОИНТ: ПУБЛИКАЦИЯ ПРОЕКТА (ЗАЩИЩЕННЫЙ) =================
@app.post("/api/projects", status_code=status.HTTP_201_CREATED, tags=["Projects"])
@app.post("/api/projects/", status_code=status.HTTP_201_CREATED, tags=["Projects"])
async def create_project(
    title: str = Form(...),
    shortDesc: str = Form(...),
    fullDesc: str = Form(""),
    direction: str = Form(...),
    lang: str = Form(""),
    github: str = Form(""),
    commentsDisabled: bool = Form(False),
    files: list[UploadFile] = File(default=[]), 
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Защита от спама файлами (лимит количества)
    if len(files) > MAX_FILES_COUNT:
        raise HTTPException(
            status_code=400, 
            detail=f"Нельзя прикрепить больше {MAX_FILES_COUNT} медиафайлов!"
        )

    saved_media_urls = []

    for file in files:
        # 2. Валидация расширения/типа файла
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"Файл {file.filename} имеет недопустимый формат! Разрешены только фото и mp4/mov видео."
            )
            
        # 3. Валидация размера файла (защита от Denial of Service)
        await file.seek(0, os.SEEK_END)
        file_size = file.tell()
        await file.seek(0) # Обязательно возвращаем указатель в начало перед чтением
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"Файл {file.filename} превышает лимит в 50 МБ!"
            )

        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        saved_media_urls.append(f"http://localhost:8000/static/{unique_filename}")

    new_project = Project(
        title=title,
        short_desc=shortDesc,
        full_desc=fullDesc,
        direction=direction,
        lang=lang,
        github=github,
        comments_disabled=commentsDisabled,
        author_id=current_user.id,
        media_urls=saved_media_urls 
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    return {
        "id": new_project.id,
        "title": new_project.title,
        "shortDesc": new_project.short_desc,
        "fullDesc": new_project.full_desc,
        "direction": new_project.direction,
        "lang": new_project.lang,
        "github": new_project.github,
        "commentsDisabled": new_project.comments_disabled,
        "author": current_user.username,
        "author_id": new_project.author_id,
        "media": new_project.media_urls,
        "likesCount": 0,
        "hasLiked": False,
    }


    new_project = Project(
        title=title,
        short_desc=shortDesc,
        full_desc=fullDesc,
        direction=direction,
        lang=lang,
        github=github,
        comments_disabled=commentsDisabled,
        author_id=current_user.id,
        media_urls=saved_media_urls 
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    return {
        "id": new_project.id,
        "title": new_project.title,
        "shortDesc": new_project.short_desc,
        "fullDesc": new_project.full_desc,
        "direction": new_project.direction,
        "lang": new_project.lang,
        "github": new_project.github,
        "commentsDisabled": new_project.comments_disabled,
        "author": current_user.username,
        "author_id": new_project.author_id,
        "media": new_project.media_urls,
        "likesCount": 0,
        "hasLiked": False,
    }

# ================= ЭНДПОИНТ: УДАЛЕНИЕ С ПРОВЕРКОЙ АВТОРСТВА =================
@app.delete("/api/projects/{project_id}", tags=["Projects"])
async def delete_project(project_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Проект на Chrt-Hub не найден")
    
    # Жесткая проверка: студент может удалить только свой проект
    if project.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Вы не можете удалять чужие проекты!")
        
    await db.delete(project)
    await db.commit()
    return {"status": "deleted"}




# ================= ИСПРАВЛЕННЫЙ ЭНДПОИНТ: ПОЛУЧЕНИЕ КОММЕНТАРИЕВ ДЛЯ ВСЕХ =================
@app.get("/api/projects/{project_id}/comments", response_model=list[CommentResponse], tags=["Comments"])
async def get_project_comments(project_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    # 1. Вручную и безопасно проверяем наличие заголовка Authorization
    user_id = None
    auth_header = request.headers.get("Authorization")
    
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
        except JWTError:
            pass  # Если токен сломан или истек, просто читаем как аноним

    # 2. Запрашиваем комментарии из базы (этот код выполняется теперь и для анонимов, и для студентов!)
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author), selectinload(Comment.votes))
        .where(Comment.project_id == project_id)
        .order_by(Comment.id.asc())
    )
    comments = result.scalars().all()

    response = []
    for c in comments:
        likes = sum(1 for v in c.votes if v.is_like)
        dislikes = sum(1 for v in c.votes if not v.is_like)
        
        # Выясняем, как проголосовал текущий пользователь (если он авторизован)
        user_vote = None
        if user_id:
            for v in c.votes:
                if v.user_id == user_id:
                    user_vote = v.is_like
                    break

        response.append({
            "id": c.id,
            "text": c.text,
            "project_id": c.project_id,
            "author_id": c.author_id,
            "author_name": c.author.username,
            "author_group": c.author.group_name,
            "likes_count": likes,
            "dislikes_count": dislikes,
            "user_vote": user_vote
        })
    
    return response



# ================= ЭНДПОИНТ: ДОБАВЛЕНИЕ КОММЕНТАРИЯ =================
@app.post("/api/comments", response_model=CommentResponse, tags=["Comments"])
async def create_comment(comment_data: CommentCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Проверяем, существует ли проект и не отключены ли комментарии
    proj_res = await db.execute(select(Project).where(Project.id == comment_data.project_id))
    project = proj_res.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Проект не найден")
    if project.comments_disabled:
        raise HTTPException(status_code=400, detail="Обсуждение этого проекта отключено автором")

    new_comment = Comment(
        text=comment_data.text,
        project_id=comment_data.project_id,
        author_id=current_user.id
    )
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)

    return {
        "id": new_comment.id,
        "text": new_comment.text,
        "project_id": new_comment.project_id,
        "author_id": new_comment.author_id,
        "author_name": current_user.username,
        "author_group": current_user.group_name,
        "likes_count": 0,
        "dislikes_count": 0,
        "user_vote": None
    }

# ================= ЭНДПОИНТ: ЛАЙК / ДИЗЛАЙК С ЛОГИКОЙ TOGGLE (ЗАЩИЩЕННЫЙ) =================
@app.post("/api/comments/{comment_id}/vote", tags=["Comments"])
async def vote_comment(comment_id: int, vote_data: VoteRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Проверяем наличие комментария
    comm_res = await db.execute(select(Comment).where(Comment.id == comment_id))
    if not comm_res.scalars().first():
        raise HTTPException(status_code=404, detail="Комментарий не найден")

    # ИСПРАВЛЕНО: Теперь ищем голос ИМЕННО ЭТОГО залогиненного студента (защита от IDOR)
    vote_res = await db.execute(
        select(CommentVote)
        .where(CommentVote.user_id == current_user.id, CommentVote.comment_id == comment_id)
    )
    existing_vote = vote_res.scalars().first()

    if existing_vote:
        if existing_vote.is_like == vote_data.is_like:
            # Если кликнули на то же самое состояние — забираем голос (Toggle OFF)
            await db.delete(existing_vote)
            msg = "Голос убран"
        else:
            # Если кликнули на противоположное состояние — меняем лайк на дизлайк (или наоборот)
            existing_vote.is_like = vote_data.is_like
            msg = "Голос изменен"
    else:
        # Голоса не было — создаем новую запись
        new_vote = CommentVote(
            user_id=current_user.id,
            comment_id=comment_id,
            is_like=vote_data.is_like
        )
        db.add(new_vote)
        msg = "Голос учтен"

    await db.commit()
    return {"status": "success", "message": msg}


@app.get("/api/users/rating", tags=["System"])
async def get_users_rating(db: AsyncSession = Depends(get_db)):

    query = (
        select(
            User.username, 
            User.group_name, 
            func.count(distinct(ProjectLike.id)).label("total_likes")
        )
        .join(Project, User.id == Project.author_id, isouter=True)
        .join(ProjectLike, Project.id == ProjectLike.project_id, isouter=True)
        .group_by(User.id, User.username, User.group_name)
        .order_by(func.count(distinct(ProjectLike.id)).desc(), User.username.asc())
        .limit(5)
    )
    
    result = await db.execute(query)
    rating_data = result.all()
    
    return [
        {
            "name": f"{r.username} ({r.group_name})",
            "count": r.total_likes
        }
        for r in rating_data
    ]


@app.post("/api/projects/{project_id}/like", tags=["Projects"])
async def toggle_project_like(project_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    proj_res = await db.execute(select(Project).where(Project.id == project_id))
    if not proj_res.scalars().first():
        raise HTTPException(status_code=404, detail="Проект не найден")

    # Ищем существующий лайк от этого студента
    like_res = await db.execute(
        select(ProjectLike).where(ProjectLike.user_id == current_user.id, ProjectLike.project_id == project_id)
    )
    existing_like = like_res.scalars().first()

    if existing_like:
        await db.delete(existing_like)
        msg = "Лайк убран"
    else:
        new_like = ProjectLike(user_id=current_user.id, project_id=project_id)
        db.add(new_like)
        msg = "Лайк поставлен"
    
    await db.commit()
    return {"status": "success", "message": msg}
