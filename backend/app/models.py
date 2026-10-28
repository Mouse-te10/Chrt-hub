from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, UniqueConstraint, ARRAY
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    group_name = Column(String(20), nullable=False)  # Чистое название группы (например, Ис-381)
    about = Column(Text, nullable=True)

    # Связи
    projects = relationship("Project", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    votes = relationship("CommentVote", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False, index=True)
    short_desc = Column(String(255), nullable=False)
    full_desc = Column(Text, nullable=True)
    direction = Column(String(50), nullable=False)  # Веб-разработка, Дизайн, Game-dev и т.д.
    lang = Column(String(30), nullable=True)         # Python, JS, C++
    github = Column(String(255), nullable=True)
    comments_disabled = Column(Boolean, default=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Связи
    author = relationship("User", back_populates="projects")
    comments = relationship("Comment", back_populates="project", cascade="all, delete-orphan")
    media_urls = Column(ARRAY(String), nullable=True, default=[])
    likes = relationship("ProjectLike", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Связи
    author = relationship("User", back_populates="comments")
    project = relationship("Project", back_populates="comments")
    votes = relationship("CommentVote", back_populates="comment", cascade="all, delete-orphan")


class CommentVote(Base):
    """Таблица для хранения лайков и дизлайков (один юзер - один голос)"""
    __tablename__ = "comment_votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    comment_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False)
    is_like = Column(Boolean, nullable=False)  # True = Лайк, False = Дизлайк

    # Связи
    user = relationship("User", back_populates="votes")
    comment = relationship("Comment", back_populates="votes")

    # Жесткое ограничение: один пользователь может проголосовать за один коммент только один раз
    __table_args__ = (UniqueConstraint('user_id', 'comment_id', name='_user_comment_vote_uc'),)


class ProjectLike(Base):
    """Таблица для хранения лайков на сами проекты (один юзер - один лайк на проект)"""
    __tablename__ = "project_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)

    # Жесткое ограничение на уровне СУБД: один студент — один лайк проекту
    __table_args__ = (UniqueConstraint('user_id', 'project_id', name='_user_project_like_uc'),)

