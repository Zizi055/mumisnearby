# Пробный период (trial)

## Что уже готово

Файл `trial.py` содержит всю логику пробного периода: 3 дня, 5 генераций
сказок, 1 голос, плюс гейтинг остального контента по `access_lvl`, который
уже отдают `GET /api/content/*`. Учитывает реферальный weekly-бонус
(`GET /api/subscription/bonus`) — пока он активен, доступ такой же, как в
активном триале, даже если сам триал по времени истёк.

Твоя задача — подключить его к проекту так же, как support.py.

---

## 1. Подключить роутер в main.py

```python
from trial import trial_router

app.include_router(trial_router, prefix="/subscription")
```

Эндпоинты не пересекаются с `/subscription/status`, `/activate`, `/cancel`:
- `GET /subscription/trial` — статус триала целиком (лимиты, access_level, weekly_bonus_active)
- `GET /subscription/trial/check-content?access_lvl=N` — проверить доступ к карточке без списания
- `GET /subscription/trial/check-quota?quota=fairy_tale|voice` — проверить лимит без списания

---

## 2. Прогнать миграцию

`migration_add_trial_fields.py` добавляет в `users`: `trial_ends_at`,
`trial_plays_used`, `trial_voices_used`. Скопируй в `alembic/versions/`
(алембика в проекте пока нет — сначала `alembic init`), поправь
`down_revision`, либо накати SQL из низа файла напрямую.

При регистрации (`POST /auth/register`) выставляй
`trial_ends_at = now() + timedelta(days=3)`.

---

## 3. Раскомментировать импорты в trial.py

```python
from database import get_db
from auth import get_current_user
from models import User, Subscription
```

И два места, которые нужно связать с уже существующими сервисами, а не
дублировать логику:
- `_user_weekly_bonus_active` → переиспользовать то, что стоит за
  `GET /api/subscription/bonus` (поле `weekly_content`)
- `_get_content_access_lvl` → переиспользовать то, что стоит за
  `GET /api/content/{type}` (поле `access_lvl` карточки)

---

## 4. Встроить гейтинг в реальные эндпоинты

**POST /generations/** — до создания задачи:

```python
from trial import require_generation_access, on_generation_created

ts = await require_generation_access(body.content_type, body.content_id, current_user, db)
generation = await create_generation_task(body, current_user, db)
await on_generation_created(body.content_type, ts, current_user, db)
```

**POST /voices/add** — до обработки файла:

```python
from trial import require_voice_access, increment_trial_voice

trial: TrialStatus = Depends(require_voice_access)
# после успешной загрузки:
if not trial.has_subscription:
    await increment_trial_voice(str(current_user.id), db)
```

Списки `GET /api/content/*` трогать не обязательно — `access_lvl` уже в
каждой карточке, фронт сам решает, показывать замок или нет.

---

## Итого — чеклист

- [ ] Роутер подключён в `main.py`
- [ ] Миграция прогнана, поля есть в `users`
- [ ] `trial_ends_at` выставляется при регистрации
- [ ] Импорты раскомментированы, `_user_weekly_bonus_active` и
      `_get_content_access_lvl` связаны с реальными сервисами
- [ ] `require_generation_access` / `on_generation_created` встроены в
      `POST /generations/`
- [ ] `require_voice_access` встроен в `POST /voices/add`
