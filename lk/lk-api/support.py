# ========================================
#   SUPPORT TICKETS — FastAPI + PostgreSQL
# ========================================
#
#   Зависимости:
#   pip install fastapi asyncpg sqlalchemy[asyncio] alembic aiosmtplib python-multipart aiofiles
#
#   ENV-переменные (.env):
#   DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname
#   SMTP_HOST=smtp.example.com
#   SMTP_PORT=465
#   SMTP_USER=support@example.com
#   SMTP_PASS=secret
#   SUPPORT_EMAIL=team@example.com   # куда падают уведомления команде
# ========================================

from __future__ import annotations

import enum
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

import aiofiles
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, DateTime, Enum, String, Text, func, select
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# ========================================
#   БАЗА ДАННЫХ
# ========================================

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/dbname")

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        yield session


# ========================================
#   МОДЕЛЬ
# ========================================

class TicketStatus(str, enum.Enum):
    new = "new"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class TicketType(str, enum.Enum):
    voice_model = "voice_model"
    billing = "billing"
    technical = "technical"
    other = "other"


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)   # FK → users.id
    user_email = Column(String(255), nullable=False)                    # денормализация для быстрой отправки письма
    type = Column(Enum(TicketType), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    attachment_url = Column(String(512), nullable=True)
    status = Column(Enum(TicketStatus), nullable=False, default=TicketStatus.new)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ========================================
#   СХЕМЫ
# ========================================

class TicketCreateResponse(BaseModel):
    id: uuid.UUID
    status: TicketStatus
    created_at: datetime

    class Config:
        from_attributes = True


class TicketListItem(BaseModel):
    id: uuid.UUID
    type: TicketType
    subject: str
    status: TicketStatus
    created_at: datetime

    class Config:
        from_attributes = True


# ========================================
#   ЗАГРУЗКА ФАЙЛОВ
# ========================================

UPLOAD_DIR = Path("uploads/support")
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_attachment(file: UploadFile) -> str:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Разрешены только JPG, PNG, WEBP, PDF",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Файл не должен превышать 10 МБ",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4()}{ext}"
    path = UPLOAD_DIR / filename

    async with aiofiles.open(path, "wb") as f:
        await f.write(content)

    return f"/uploads/support/{filename}"


# 
#   EMAIL 

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.example.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "support@example.com")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "team@example.com")


async def _send(to: str, subject: str, body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_PASS,
        use_tls=True,
    )


async def notify_team(ticket: SupportTicket) -> None:
    """Уведомление команды — падает на SUPPORT_EMAIL."""
    body = f"""
    <h3>Новое обращение #{ticket.id}</h3>
    <p><b>Тип:</b> {ticket.type.value}</p>
    <p><b>Тема:</b> {ticket.subject}</p>
    <p><b>От:</b> {ticket.user_email}</p>
    <p><b>Сообщение:</b><br>{ticket.message}</p>
    {"<p><b>Вложение:</b> " + ticket.attachment_url + "</p>" if ticket.attachment_url else ""}
    """
    await _send(SUPPORT_EMAIL, f"[Поддержка] {ticket.subject}", body)


async def notify_user(ticket: SupportTicket) -> None:
    """Автоответ пользователю с номером тикета."""
    body = f"""
    <p>Здравствуйте!</p>
    <p>Мы получили ваше обращение <b>#{ticket.id}</b> на тему «{ticket.subject}».</p>
    <p>Наша команда ответит вам в течение 24 часов.</p>
    <br>
    <p>С уважением,<br>Служба поддержки</p>
    """
    await _send(ticket.user_email, f"Обращение #{ticket.id} принято", body)


# ========================================
#   РОУТЕР
# ========================================

router = APIRouter(prefix="/support", tags=["support"])


@router.post(
    "/tickets",
    response_model=TicketCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать обращение",
)
async def create_ticket(
    # current_user: User = Depends(get_current_user),  # ← подключи свою auth-зависимость
    user_id: uuid.UUID = Form(...),       # временно как form-поле; заменить на current_user.id
    user_email: EmailStr = Form(...),     # временно; заменить на current_user.email
    type: TicketType = Form(...),
    subject: str = Form(..., max_length=255),
    message: str = Form(...),
    attachment: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    attachment_url = None
    if attachment and attachment.filename:
        attachment_url = await save_attachment(attachment)

    ticket = SupportTicket(
        user_id=user_id,
        user_email=user_email,
        type=type,
        subject=subject,
        message=message,
        attachment_url=attachment_url,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    # Письма отправляем после коммита — тикет точно сохранён
    await notify_team(ticket)
    await notify_user(ticket)

    return ticket


@router.get(
    "/tickets",
    response_model=list[TicketListItem],
    summary="История обращений пользователя",
)
async def list_tickets(
    user_id: uuid.UUID,   # заменить на current_user.id
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.user_id == user_id)
        .order_by(SupportTicket.created_at.desc())
    )
    return result.scalars().all()


@router.get(
    "/tickets/{ticket_id}",
    response_model=TicketListItem,
    summary="Детали обращения",
)
async def get_ticket(
    ticket_id: uuid.UUID,
    user_id: uuid.UUID,   # заменить на current_user.id
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SupportTicket).where(
            SupportTicket.id == ticket_id,
            SupportTicket.user_id == user_id,   # пользователь видит только свои тикеты
        )
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Обращение не найдено")
    return ticket
