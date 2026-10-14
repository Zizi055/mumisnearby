# Выкат B2B-версии на rodnoygolos.ru

Обе версии живут в одном репозитории и собираются из одного кода.
Отличает их переменная `VITE_EDITION`.

```
VITE_EDITION=b2c  →  rodnyegolosa.ru   lk/dist      (как сейчас)
VITE_EDITION=b2b  →  rodnoygolos.ru    lk/dist-b2b
```

Папки сборки разные намеренно: при одинаковых вторая сборка затирала бы
первую, и на один из доменов уезжал бы чужой кабинет.

Лендинги — две точки входа одной сборки: `index.html` и `b2b.html`.
Стили и скрипты общие, различаются только тексты и ссылки.

---

## 1. Домен

Купить `rodnoygolos.ru` (где угодно, в том числе на Бегете) и направить
A-записью на тот же сервер:

```
A   @     90.156.170.14
A   www   90.156.170.14
```

Отдельный хостинг не нужен и вреден: бэкенд живёт на этом сервере, и
всё работает потому, что nginx проксирует `/api/` на тот же origin. На
чужом хостинге каждый запрос станет кросс-доменным — придётся настраивать
CORS, разбираться с cookies и `credentials: 'include'`, а SSE-уведомления
через сторонний хостинг могут не пойти вовсе.

## 2. Сборка на сервере

Корпоративная версия собирается одной командой, и она **не трогает
«Родные голоса»**:

```bash
cd /var/www/rodnyegolosa.ru/mumisnearby
git pull origin main
npm install
npm run build:b2b
```

Что при этом происходит:

| Что | Состояние после сборки |
|---|---|
| `dist/b2b.html` | пересобран, наши правки |
| `lk/dist-b2b/` | пересобран, кабинет компаний |
| `dist/lk/` | **не пересобирался** — вернулся тот же, что был |
| `dist/index.html` | перегенерирован, содержимое не изменилось |

Про последнюю строку. Лендинги — одна сборка vite с тремя точками
входа, разделить их нельзя: `vite build` всегда делает index.html,
b2b.html и constructor.html вместе и чистит перед этим всю папку dist.
Поэтому сценарий `scripts/build-b2b.mjs` прячет готовый кабинет B2C во
временную папку и возвращает его на место как есть. Содержимое
index.html при этом не меняется — может смениться только хеш в имени
общего CSS-файла.

Когда нужно выкатить именно B2C (правки в index.html или в клиентском
кабинете) — обычная команда, как раньше:

```bash
npm run build
```

## 3. Блок nginx для нового домена

Корень тот же каталог сборки лендингов, но `index` — `b2b.html`, а `/lk/`
отдаётся из `dist-b2b`. Все API-префиксы проксируются так же, как на
основном домене, — иначе кабинет на новом домене не увидит бэкенд.

```nginx
server {
    listen 80;
    server_name rodnoygolos.ru www.rodnoygolos.ru;

    root /var/www/rodnyegolosa.ru/mumisnearby/dist;

    # Главная — корпоративный лендинг, а не index.html
    location = / {
        try_files /b2b.html =404;
    }

    location / {
        try_files $uri $uri/ /b2b.html;
    }

    # Кабинет: своя сборка редакции B2B
    location /lk/ {
        alias /var/www/rodnyegolosa.ru/mumisnearby/lk/dist-b2b/;
        try_files $uri $uri/ /lk/index.html;
    }

    # ─── API ───────────────────────────────────────────────────────
    # Префиксы перечислены по одному, а не одним /, потому что корень
    # отдаёт статику. Набор должен совпадать с основным доменом.
    location ~ ^/(api|auth|voices|generations|subscription|support|admin|super_admin|b2b|promo|notifications|referral|profile)(/|$) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE-уведомления: буферизация обязана быть выключена, иначе
    # nginx держит поток у себя и колокольчик не обновляется.
    location = /notifications/stream {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 24h;
    }
}
```

Готовый файл лежит в репозитории: `deploy/nginx-rodnoygolos.ru.conf`.
Вставлять его в терминал руками нельзя — zsh экранирует точку с запятой
после URL, и `proxy_pass` ломается молча (`nginx -t` при этом проходит).

```bash
cp deploy/nginx-rodnoygolos.ru.conf /etc/nginx/sites-available/rodnoygolos.ru
ln -s /etc/nginx/sites-available/rodnoygolos.ru /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**Одного симлинка мало.** В `nginx.conf` этого сервера подключён не
`sites-enabled/*`, а конкретный файл:

```
include /etc/nginx/sites-enabled/rodnyegolosa.ru;
```

Рядом нужна вторая строка:

```
include /etc/nginx/sites-enabled/rodnoygolos.ru;
```

Без неё конфиг не читается вовсе, а запросы уходят в блок старого
домена и получают 301 на его https.

## 4. SSL

```bash
certbot --nginx -d rodnoygolos.ru -d www.rodnoygolos.ru --non-interactive --agree-tos --redirect
```

Certbot сам допишет редирект на https и блок на 443 — **прямо в
`/etc/nginx/sites-available/rodnoygolos.ru`**. Поэтому повторное
копирование конфига из репозитория стирает SSL, и после каждого `cp`
нужно снова прогнать эту же команду: сертификат уже выпущен, certbot
просто переустановит его.

## 5. Проверить после выката

| Что | Адрес | Ожидаемо |
|---|---|---|
| Лендинг | `rodnoygolos.ru` | корпоративные тексты, нет «Конструктора» и программы лояльности |
| Регистрация компании | `/lk/#/hr/register` | форма с расчётом стоимости |
| Вход HR | `/lk/#/hr/login` | форма входа |
| Активация кода | `/lk/#/promo` | поле с автоформатированием |
| Кабинет сотрудника | `/lk/#/subscription/tariff` | тариф только для чтения, без оплаты |
| Старый домен | `rodnyegolosa.ru` | ничего не изменилось |

Последняя строка — главная: B2C-сборка от этих правок не меняется, и это
стоит проверить глазами до того, как объявлять релиз.

## 6. Пока бэкенд не готов

Корпоративных эндпоинтов (`/b2b/*`, `/auth/hr/*`, `/promo/*`) на сервере
ещё нет — см. `B2B_BACKEND_SPEC.md`. До их появления кабинет HR
открывается, но вместо данных показывает честную заглушку «ещё не
подключено на сервере», а не пустые списки. Лендинг работает полностью.
