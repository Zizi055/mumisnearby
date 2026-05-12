# Support Tickets 

## Что уже готово

Файл `support.py` содержит полную реализацию модуля поддержки.
Твоя задача — подключить его к проекту и настроить окружение.

---

## 1. Установить зависимости

```bash
pip install fastapi asyncpg sqlalchemy[asyncio] alembic aiosmtplib python-multipart aiofiles
```

---

## 2. Подключить роутер в main.py

```python
from support import router as support_router

app.include_router(support_router, prefix="/api")
```

После этого эндпоинты будут доступны по адресам:
- `POST   /api/support/tickets`        — создать обращение
- `GET    /api/support/tickets`        — список обращений пользователя
- `GET    /api/support/tickets/{id}`   — детали обращения

---

## 3. Создать таблицу через Alembic

```bash
alembic revision --autogenerate -m "add support_tickets"
alembic upgrade head
```

Будет создана таблица `support_tickets` со следующими полями:

| Поле             | Тип         | Описание                          |
|------------------|-------------|-----------------------------------|
| `id`             | UUID        | Первичный ключ                    |
| `user_id`        | UUID        | FK на таблицу users               |
| `user_email`     | VARCHAR     | Email пользователя                |
| `type`           | ENUM        | Тип обращения (см. ниже)          |
| `subject`        | VARCHAR 255 | Тема                              |
| `message`        | TEXT        | Текст обращения                   |
| `attachment_url` | VARCHAR 512 | Путь к файлу (может быть NULL)    |
| `status`         | ENUM        | Статус (см. ниже)                 |
| `created_at`     | TIMESTAMPTZ | Дата создания                     |
| `updated_at`     | TIMESTAMPTZ | Дата последнего обновления        |

**Типы обращений (`type`):**
`voice_model` · `billing` · `technical` · `other`

**Статусы (`status`):**
`new` → `in_progress` → `resolved` → `closed`

---

## 4. Заполнить .env

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname

SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=support@example.com
SMTP_PASS=secret

SUPPORT_EMAIL=team@example.com
```

`SUPPORT_EMAIL` — адрес куда приходят уведомления о новых обращениях.

---

## 5. Подключить авторизацию

В файле `support.py` есть два места помеченных `# TODO`:

```python
# support.py → эндпоинт create_ticket
body.append('user_id',    'USER_ID_HERE')    # заменить
body.append('user_email', 'USER_EMAIL_HERE') # заменить
```

Заменить Form-поля `user_id` и `user_email` на зависимость из вашей auth-системы:

```python
# Было
user_id: uuid.UUID = Form(...),
user_email: EmailStr = Form(...),

# Стало (пример)
current_user: User = Depends(get_current_user),
# и дальше использовать current_user.id и current_user.email
```

---

## 6. Раздать статику для вложений

Файлы сохраняются в папку `uploads/support/` и возвращаются как URL вида `/uploads/support/uuid.pdf`.

Нужно подключить раздачу статики в `main.py`:

```python
from fastapi.staticfiles import StaticFiles

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

Убедиться что папка `uploads/support/` существует или создаётся автоматически (в коде уже есть `mkdir(parents=True, exist_ok=True)`).

---

## 7. Проверить работу

Создать тестовое обращение через curl:

```bash
curl -X POST http://localhost:8000/api/support/tickets \
  -F "type=technical" \
  -F "subject=Тест" \
  -F "message=Проверка связи" \
  -F "user_id=00000000-0000-0000-0000-000000000001" \
  -F "user_email=test@example.com"
```

Ожидаемый ответ `201 Created`:
```json
{
  "id": "...",
  "status": "new",
  "created_at": "..."
}
```

После этого на `SUPPORT_EMAIL` должно прийти письмо с деталями обращения,
а на `user_email` — автоответ с номером тикета.

---

## Итого — чеклист

- [ ] Установлены зависимости
- [ ] Роутер подключён в `main.py`
- [ ] Миграция прогнана, таблица создана
- [ ] `.env` заполнен рабочими SMTP-данными
- [ ] `user_id` / `user_email` заменены на auth-зависимость
- [ ] Статика подключена, вложения открываются по ссылке
- [ ] Тестовый запрос прошёл, письма пришли
