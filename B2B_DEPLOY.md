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

```bash
cd /var/www/rodnyegolosa.ru/mumisnearby
git pull origin main

# лендинги: index.html и b2b.html собираются вместе
npm install && npm run build

# кабинет, две редакции
cd lk && npm install
npm run build        # → lk/dist      (B2C)
npm run build:b2b    # → lk/dist-b2b  (B2B)
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

Положить в `/etc/nginx/sites-available/rodnoygolos.ru`, включить и
проверить:

```bash
ln -s /etc/nginx/sites-available/rodnoygolos.ru /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 4. SSL

```bash
certbot --nginx -d rodnoygolos.ru -d www.rodnoygolos.ru
```

Certbot сам допишет редирект на https и блок на 443.

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
