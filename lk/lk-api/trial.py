"""
trial.py — логика демо-периода для «Родных голосов»

──────────────────────────────────────────────────────────────────────────────
ВЕРСИЯ 2 — приведено в соответствие с тем, что реальный бэкенд уже реализовал
(см. openapi.json от бэкенда). Главные отличия от версии 1:

  1. Реальный бэк уже отдаёт `access_lvl` в каждой карточке контента
     (/api/content/fairy-tales, /lullabies, /therapies, /poems, /stories,
     /family-stories). Значит гейтинг по типу контента (жёсткий список
     TRIAL_LOCKED_CONTENT) больше не нужен — вместо него сравниваем
     access_lvl карточки с уровнем доступа пользователя.

  2. Прослушивание сказки / генерация озвучки теперь идёт через реальный
     асинхронный модуль `/generations` (POST создаёт задачу → GET /status
     опрашивается → GET /audio отдаёт presigned-ссылку). Отдельных
     эндпоинтов `/subscription/trial/use-play` и `/use-voice` для сказок
     больше нет — списание триал-лимита происходит внутри хендлера
     POST /generations/ (см. require_generation_access / on_generation_created
     ниже).

  3. У бэка есть свой реферальный бонус `/api/subscription/bonus`
     (invited_count, max_invites, weekly_content). Если у пользователя
     активирован weekly_content — это то же самое, что «пользователь
     временно на уровне триала», даже если сам триал по времени истёк.
     Это учтено в TrialStatus.weekly_bonus_active.

Правила пробного периода (3 дня после регистрации):
  ✅ Сказки (fairy_tale)     — генерация озвучки ограничена по количеству
                                (TRIAL_PLAYS_LIMIT), не по access_lvl
  ✅ Голосовые модели         — можно загрузить/сгенерировать TRIAL_VOICES_LIMIT штук
  🔒 Остальной контент        — доступ определяется access_lvl карточки
                                относительно текущего уровня пользователя

После истечения триала (время истекло И нет weekly-бонуса) — всё, что требует
access_lvl > 0 или лимит исчерпан, блокируется, предлагается подписка.

Интеграция:
  1. Миграция: добавьте trial_ends_at, trial_plays_used, trial_voices_used
     в users (см. migration_add_trial_fields.py — без изменений).
  2. При регистрации: trial_ends_at = now() + timedelta(days=3).
  3. Подключите роутер: app.include_router(trial_router, prefix="/subscription")
     (не пересекается с реальными /subscription/status, /activate, /cancel).
  4. Раскомментируйте реальные импорты (get_db, get_current_user, модели).
  5. Внутри реального хендлера POST /generations/ вызовите
     require_generation_access(...) до создания задачи и
     on_generation_created(...) после успешного создания.
  6. Внутри реального хендлера POST /voices/add вызовите require_voice_access
     до обработки файла и increment_trial_voice после успешной загрузки.
  7. access_lvl карточек контента и weekly_content бонуса — это данные
     реального бэка, этот файл их только читает, не создаёт.
"""

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

# ── Импортируйте из вашего проекта ────────────────────────────────────────────
# from database import get_db
# from auth import get_current_user
# from models import User, Subscription
#
# Сервис реферального бонуса — переиспользуйте логику, которая уже стоит
# за GET /api/subscription/bonus, а не считайте invited_count заново:
# from referral_bonus import get_bonus_status  # -> BonusStatusResponse
#
# Доступ к access_lvl конкретной карточки контента — переиспользуйте то же,
# что отдаёт GET /api/content/{type}, а не дублируйте запрос:
# from content_library import get_content_access_lvl  # (content_type, content_id, db) -> int | None

TRIAL_DAYS = 3
TRIAL_PLAYS_LIMIT = 5    # пять сказок бесплатно (генераций content_type=fairy_tale)
TRIAL_VOICES_LIMIT = 1   # один голос бесплатно (POST /voices/add)

# ContentType бэка (см. openapi: components.schemas.ContentType) — важно:
# это значения с подчёркиванием, а не с дефисом, как в путях /api/content/*.
GENERATION_CONTENT_TYPES = {
    "fairy_tale", "lullaby", "therapy", "family_story", "poem", "story",
}

# Единственный тип контента, ограниченный по количеству, а не по access_lvl
QUOTA_LIMITED_CONTENT_TYPE = "fairy_tale"

# ─── Уровни доступа пользователя ────────────────────────────────────────────
# Сопоставимо с access_lvl карточки контента: у карточки есть минимальный
# уровень, необходимый для доступа (None/0 — всем видно). У пользователя
# есть текущий уровень:
#   2 — активная платная подписка (has_subscription)             → всё открыто
#   1 — активный триал по времени ИЛИ активный weekly-бонус       → контент с access_lvl <= 1
#   0 — триал истёк, подписки и бонуса нет                        → только access_lvl 0/None
USER_LEVEL_SUBSCRIBED = 2
USER_LEVEL_TRIAL_OR_BONUS = 1
USER_LEVEL_NONE = 0


# ─── Pydantic-схемы ───────────────────────────────────────────────────────────

class TrialStatus(BaseModel):
    is_trial_active: bool           # триал по времени ещё не истёк
    trial_ends_at: datetime | None
    days_left: int
    plays_used: int                 # генераций fairy_tale использовано в триале
    plays_limit: int                # максимум генераций fairy_tale в триале
    voices_used: int                # голосов загружено/сгенерировано
    voices_limit: int                # максимум голосов в триале
    trial_expired: bool             # время вышло
    trial_plays_limit_reached: bool # лимит генераций сказок исчерпан
    trial_voices_limit_reached: bool # лимит голосов исчерпан
    has_subscription: bool          # есть платная подписка (см. /subscription/status)
    weekly_bonus_active: bool       # активен weekly_content из /api/subscription/bonus
    access_level: int               # 0 | 1 | 2 — вычисленный уровень доступа пользователя


class ContentAccessResponse(BaseModel):
    allowed: bool
    reason: Literal[
        "ok",
        "trial_expired",
        "trial_plays_limit_reached",
        "trial_voices_limit_reached",
        "content_locked_in_trial",  # access_lvl карточки выше текущего уровня пользователя
        "subscription_required",
    ]
    trial_status: TrialStatus


# ─── Хелперы ──────────────────────────────────────────────────────────────────

def _compute_trial_status(
    user,
    subscription_active: bool,
    weekly_bonus_active: bool,
) -> TrialStatus:
    """
    Вычисляет статус триала.

    user — ORM-объект с полями:
        trial_ends_at: datetime | None
        trial_plays_used: int
        trial_voices_used: int
    """
    now = datetime.now(timezone.utc)

    trial_ends_at: datetime | None = getattr(user, "trial_ends_at", None)
    plays_used: int = getattr(user, "trial_plays_used", 0) or 0
    voices_used: int = getattr(user, "trial_voices_used", 0) or 0

    if trial_ends_at is not None and trial_ends_at.tzinfo is None:
        trial_ends_at = trial_ends_at.replace(tzinfo=timezone.utc)

    expired = trial_ends_at is None or now > trial_ends_at
    is_active = not expired
    days_left = 0 if trial_ends_at is None else max(0, (trial_ends_at.date() - now.date()).days)

    plays_limit_reached = plays_used >= TRIAL_PLAYS_LIMIT
    voices_limit_reached = voices_used >= TRIAL_VOICES_LIMIT

    access_level = _resolve_access_level(
        has_subscription=subscription_active,
        trial_active=is_active,
        weekly_bonus_active=weekly_bonus_active,
    )

    return TrialStatus(
        is_trial_active=is_active,
        trial_ends_at=trial_ends_at,
        days_left=days_left,
        plays_used=plays_used,
        plays_limit=TRIAL_PLAYS_LIMIT,
        voices_used=voices_used,
        voices_limit=TRIAL_VOICES_LIMIT,
        trial_expired=expired,
        trial_plays_limit_reached=plays_limit_reached,
        trial_voices_limit_reached=voices_limit_reached,
        has_subscription=subscription_active,
        weekly_bonus_active=weekly_bonus_active,
        access_level=access_level,
    )


def _resolve_access_level(
    has_subscription: bool,
    trial_active: bool,
    weekly_bonus_active: bool,
) -> int:
    if has_subscription:
        return USER_LEVEL_SUBSCRIBED
    if trial_active or weekly_bonus_active:
        return USER_LEVEL_TRIAL_OR_BONUS
    return USER_LEVEL_NONE


async def _user_has_active_subscription(user_id: str, db: "AsyncSession") -> bool:
    """
    Заглушка — при подключении лучше переиспользовать ту же проверку, что
    стоит за GET /subscription/status, чтобы не разойтись с реальным
    источником истины.
    """
    from models import Subscription  # ваш импорт
    result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status == "active",
        )
    )
    return result.scalar_one_or_none() is not None


async def _user_weekly_bonus_active(user_id: str, db: "AsyncSession") -> bool:
    """
    Заглушка — переиспользуйте сервис, стоящий за GET /api/subscription/bonus
    (поле weekly_content в BonusStatusResponse), а не считайте invited_count
    заново здесь.

        from referral_bonus import get_bonus_status
        status = await get_bonus_status(user_id, db)
        return status.weekly_content
    """
    return False


async def increment_trial_play(user_id: str, db: "AsyncSession") -> None:
    """Засчитать генерацию озвучки сказки (content_type=fairy_tale) в триале."""
    from models import User
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(trial_plays_used=User.trial_plays_used + 1)
    )
    await db.commit()


async def increment_trial_voice(user_id: str, db: "AsyncSession") -> None:
    """Засчитать загрузку голоса (POST /voices/add) в триале."""
    from models import User
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(trial_voices_used=User.trial_voices_used + 1)
    )
    await db.commit()


async def _get_content_access_lvl(
    content_type: str,
    content_id: int,
    db: "AsyncSession",
) -> int | None:
    """
    Заглушка — должна вернуть access_lvl той самой карточки, которую отдаёт
    GET /api/content/{type} (FairyTaleListResponse.access_lvl и т.д.).
    Переиспользуйте существующий репозиторный метод бэка, не дублируйте запрос:

        from content_library import get_content_access_lvl
        return await get_content_access_lvl(content_type, content_id, db)

    None/0 = доступно всем.
    """
    return None


# ─── Общая функция проверки доступа ───────────────────────────────────────────

def check_item_access(access_lvl: int | None, ts: TrialStatus) -> ContentAccessResponse:
    """
    Проверяет доступ к конкретной карточке контента по её access_lvl
    (lullaby / therapy / poem / story / family_story).
    Не делает side-effect — только проверяет.
    """
    if ts.has_subscription:
        return ContentAccessResponse(allowed=True, reason="ok", trial_status=ts)

    required = access_lvl or 0
    if required <= ts.access_level:
        return ContentAccessResponse(allowed=True, reason="ok", trial_status=ts)

    reason = "trial_expired" if ts.trial_expired and not ts.weekly_bonus_active else "content_locked_in_trial"
    return ContentAccessResponse(allowed=False, reason=reason, trial_status=ts)


def check_quota_access(
    ts: TrialStatus,
    quota: Literal["fairy_tale", "voice"],
) -> ContentAccessResponse:
    """
    Проверяет доступ к действиям с лимитом по количеству, а не по access_lvl:
    генерация озвучки сказки (fairy_tale) и загрузка голоса (voice).
    """
    if ts.has_subscription:
        return ContentAccessResponse(allowed=True, reason="ok", trial_status=ts)

    if ts.trial_expired and not ts.weekly_bonus_active:
        return ContentAccessResponse(allowed=False, reason="trial_expired", trial_status=ts)

    if quota == "fairy_tale":
        if ts.trial_plays_limit_reached:
            return ContentAccessResponse(
                allowed=False, reason="trial_plays_limit_reached", trial_status=ts
            )
        return ContentAccessResponse(allowed=True, reason="ok", trial_status=ts)

    if quota == "voice":
        if ts.trial_voices_limit_reached:
            return ContentAccessResponse(
                allowed=False, reason="trial_voices_limit_reached", trial_status=ts
            )
        return ContentAccessResponse(allowed=True, reason="ok", trial_status=ts)

    return ContentAccessResponse(allowed=True, reason="ok", trial_status=ts)


# ─── FastAPI зависимости ───────────────────────────────────────────────────────

async def _get_trial_status(
    current_user=None,
    db=None,
    # current_user=Depends(get_current_user),
    # db: AsyncSession = Depends(get_db),
) -> TrialStatus:
    sub_active = await _user_has_active_subscription(str(current_user.id), db)
    bonus_active = await _user_weekly_bonus_active(str(current_user.id), db)
    return _compute_trial_status(
        current_user,
        subscription_active=sub_active,
        weekly_bonus_active=bonus_active,
    )


async def require_generation_access(
    content_type: str,
    content_id: int,
    current_user=None,
    db=None,
    # current_user=Depends(get_current_user),
    # db: AsyncSession = Depends(get_db),
) -> TrialStatus:
    """
    Вызывайте в начале реального хендлера POST /generations/, ДО создания
    задачи генерации, передав content_type/content_id из тела запроса
    (GenerationCreateRequest).

    Пример встраивания в реальный роутер генераций:

        @router.post("/generations/")
        async def start_generation(
            body: GenerationCreateRequest,
            current_user=Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
        ):
            ts = await require_generation_access(
                body.content_type, body.content_id, current_user, db
            )
            generation = await create_generation_task(body, current_user, db)
            await on_generation_created(body.content_type, ts, current_user, db)
            return generation
    """
    ts = await _get_trial_status(current_user, db)

    if content_type == QUOTA_LIMITED_CONTENT_TYPE:
        result = check_quota_access(ts, "fairy_tale")
    else:
        access_lvl = await _get_content_access_lvl(content_type, content_id, db)
        result = check_item_access(access_lvl, ts)

    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": result.reason, "trial_status": ts.model_dump()},
        )
    return ts


async def on_generation_created(
    content_type: str,
    ts: TrialStatus,
    current_user=None,
    db=None,
) -> None:
    """
    Вызывайте сразу после успешного создания задачи генерации, только для
    content_type=fairy_tale (остальные типы ограничены access_lvl, а не
    счётчиком — списывать нечего).
    """
    if content_type == QUOTA_LIMITED_CONTENT_TYPE and not ts.has_subscription:
        await increment_trial_play(str(current_user.id), db)


async def require_voice_access(
    current_user=None,
    db=None,
    # current_user=Depends(get_current_user),
    # db: AsyncSession = Depends(get_db),
) -> TrialStatus:
    """
    Зависимость для реального эндпоинта POST /voices/add.

    Пример:
        @router.post("/voices/add")
        async def add_voice(
            name: str = Form(...),
            file: UploadFile = File(...),
            trial: TrialStatus = Depends(require_voice_access),
            current_user=Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
        ):
            voice = await process_voice_upload(name, file, current_user, db)
            if not trial.has_subscription:
                await increment_trial_voice(str(current_user.id), db)
            return voice
    """
    ts = await _get_trial_status(current_user, db)
    result = check_quota_access(ts, "voice")
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": result.reason, "trial_status": ts.model_dump()},
        )
    return ts


def require_content_access(content_type: str):
    """
    Фабрика зависимостей для эндпоинтов списка контента
    (/api/content/lullabies, /therapies, /poems, /stories, /family-stories),
    если нужно вернуть 403 целиком, а не отдавать список с access_lvl и
    гейтить на фронте по карточкам. Для большинства случаев рекомендуем
    отдавать список как есть (бэк уже кладёт access_lvl в каждую карточку) и
    гейтить в UI — 403 на уровне списка имеет смысл только для полностью
    закрытых разделов.

    Пример:
        @router.get("/api/content/therapies",
                     dependencies=[Depends(require_content_access("therapy"))])
        async def get_therapies(...):
            ...
    """
    async def _dep(
        current_user=None,
        db=None,
        # current_user=Depends(get_current_user),
        # db: AsyncSession = Depends(get_db),
    ):
        ts = await _get_trial_status(current_user, db)
        if ts.has_subscription or ts.access_level >= USER_LEVEL_TRIAL_OR_BONUS:
            return ts
        reason = "trial_expired" if ts.trial_expired and not ts.weekly_bonus_active else "content_locked_in_trial"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": reason, "trial_status": ts.model_dump()},
        )
    return _dep


# ─── Роутер ───────────────────────────────────────────────────────────────────

trial_router = APIRouter(tags=["trial"])


@trial_router.get(
    "/trial",
    response_model=TrialStatus,
    summary="Статус пробного периода текущего пользователя",
)
async def get_trial_status(
    current_user=None,
    db=None,
    # current_user=Depends(get_current_user),
    # db: AsyncSession = Depends(get_db),
):
    """
    Фронт вызывает при старте приложения чтобы решить:
    - какие карточки показывать с замком (access_lvl > access_level)
    - сколько осталось генераций сказок / загрузок голоса
    - показывать ли баннер с предложением подписки
    """
    return await _get_trial_status(current_user, db)


@trial_router.get(
    "/trial/check-content",
    response_model=ContentAccessResponse,
    summary="Проверить доступ к конкретной карточке контента по access_lvl",
)
async def check_trial_content_access(
    access_lvl: int = 0,  # query param — access_lvl конкретной карточки
    current_user=None,
    db=None,
    # current_user=Depends(get_current_user),
    # db: AsyncSession = Depends(get_db),
):
    """
    Не инкрементирует ничего — только проверяет. Используется фронтом перед
    открытием карточки колыбельной/терапии/стиха/рассказа/семейной истории,
    когда нужно решить, показывать замок или нет, без похода за всем списком.
    """
    ts = await _get_trial_status(current_user, db)
    return check_item_access(access_lvl, ts)


@trial_router.get(
    "/trial/check-quota",
    response_model=ContentAccessResponse,
    summary="Проверить лимит генераций сказок или загрузок голоса (без списания)",
)
async def check_trial_quota(
    quota: Literal["fairy_tale", "voice"],
    current_user=None,
    db=None,
    # current_user=Depends(get_current_user),
    # db: AsyncSession = Depends(get_db),
):
    """
    Используется фронтом, чтобы заранее показать «осталось 2 сказки» перед
    тем как реально вызывать POST /generations/ или POST /voices/add.
    Само списание лимита происходит на бэке внутри этих эндпоинтов
    (require_generation_access/on_generation_created, require_voice_access).
    """
    ts = await _get_trial_status(current_user, db)
    return check_quota_access(ts, quota)
