from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

# ---- СХЕМЫ ПОЛЬЗОВАТЕЛЯ ----

# То, что прилетает с фронтенда при регистрации
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    group_name: str = Field(..., min_length=2, max_length=20)
    about: Optional[str] = None

# То, что бэкенд возвращает в ответ (БЕЗ пароля в целях безопасности!)
class UserResponse(BaseModel):
    id: int
    username: str
    group_name: str
    about: Optional[str] = None
    project_count: int = 0  # <--- Добавляем новое поле с дефолтным значением
    
    model_config = ConfigDict(from_attributes=True)

# То, что прилетает при входе (Login)
class UserLogin(BaseModel):
    username: str
    password: str


# ---- СХЕМЫ ТОКЕНОВ БЕЗОПАСНОСТИ ----

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ---- СХЕМЫ КОММЕНТАРИЕВ ----

# То, что прилетает с фронтенда при создании комментария
class CommentCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    project_id: int

# Ответ бэкенда с данными автора и счетчиками лайков/дизлайков
class CommentResponse(BaseModel):
    id: int
    text: str
    project_id: int
    author_id: int
    author_name: str
    author_group: str
    likes_count: int
    dislikes_count: int
    user_vote: Optional[bool] = None  # True = лайк, False = дизлайк, None = нет голоса

    model_config = ConfigDict(from_attributes=True)

# Схема для отправки голоса (лайк/дизлайк)
class VoteRequest(BaseModel):
    is_like: bool
