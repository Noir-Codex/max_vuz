# MAX WebApp

Веб‑платформа для администраторов и преподавателей учебного заведения. Состоит из бэкенда на Node.js/Express и фронтенда на React (Vite). Проект реализует управление пользователями, группами, дисциплинами и расписанием, а также отображение расписания и статистики для преподавателей.

## Основные возможности

- Авторизация по логину и паролю (JWT + refresh токены).
- Ролевая модель (`admin`, `teacher`), защита маршрутов на фронтенде.
- Панель администратора: управление пользователями, группами, дисциплинами, расписанием, отчётами.
- Панель преподавателя: расписание (неделя/месяц), фильтр по предметам, просмотр пар кураторских групп.
- Сбор статистики для административной панели (количество пользователей по ролям, дисциплины, пары и т.д.).

## Технологический стек

- **Frontend:** React 18, Vite, React Router, Zustand, TanStack Query, i18next.
- **Backend:** Node.js 20, Express, PostgreSQL.
- **База данных:** PostgreSQL (внешний сервер).
- **Аутентификация:** JWT (access + refresh), bcrypt для хеширования паролей.
- **Инфраструктура:** pm2, Nginx (для продакшена), Certbot (TLS).

## Структура репозитория

```
max_project/
├── max-webapp/           # фронтенд (React + Vite)
│   ├── public/
│   ├── src/
│   └── vite.config.js
├── server/               # бэкенд (Express)
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── scripts/          # вспомогательные SQL/инициализация
│   └── server.js
└── README.md
```

## Требования

- Node.js ≥ 20
- npm ≥ 9
- PostgreSQL ≥ 13 (внешний сервер или локальная установка)

## Переменные окружения

### Бэкенд (`server/.env`)

```ini
PORT=3001
NODE_ENV=development
JWT_SECRET=<случайная строка>

# Разрешённые origin'ы через запятую (для CORS)
ALLOWED_ORIGINS=http://localhost:3000

DB_HOST=<хост PostgreSQL>
DB_PORT=5432
DB_NAME=<имя базы>
DB_USER=<пользователь>
DB_PASSWORD=<пароль>

# Для подключения без TLS установите DB_SSL=false
DB_SSL=true
# DB_SSL_CERT_PATH=.cloud-certs/root.crt   # при необходимости используйте свой сертификат
```

> ⚠️ Параметр `JWT_SECRET` должен быть длинной случайной строкой (`openssl rand -base64 48`).

### Фронтенд (`max-webapp/.env.local`)

```ini
VITE_API_BASE_URL=http://localhost:3001/api
```

Vite берёт `VITE_API_BASE_URL` при сборке, в дев‑режиме также можно использовать прокси `/api` (см. `vite.config.js`).

## Локальный запуск

1. Установить зависимости:
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../max-webapp
   npm install
   ```

2. Заполнить `.env` файлы (см. выше).

3. Запустить бэкенд:
   ```bash
   cd ../server
   PORT=3001 NODE_ENV=development ALLOWED_ORIGINS=http://localhost:3000 npm start
   ```
   При старте бэкенд проверит схему базы данных. Таблицы создаются только если их нет (существующие данные не трогаются).

4. Запустить фронтенд:
   ```bash
   cd ../max-webapp
   npm run dev
   ```
   Фронт доступен на `http://localhost:3000`, API — на `http://localhost:3001/api`.

5. Тестовый логин администратора (если вручную не создавали):
   - Email: `admin@max.local`
   - Пароль: `Admin123!`

## Полезные npm‑скрипты

```bash
# server/package.json
npm start                 # запустить API (node server.js)
npm run lint              # линтинг
npm run init-db           # выполнить scripts/initDatabase.js (создаёт схему, теперь идемпотентно)

# max-webapp/package.json
npm run dev               # дев-сервер Vite (порт 3000, strictPort = true)
npm run build             # production сборка (выход в max-webapp/dist)
npm run preview           # предпросмотр собранной версии
```

## Сборка production фронтенда

```bash
cd max-webapp
VITE_API_BASE_URL=https://example.com/api npm run build
```

Собранные файлы появятся в `max-webapp/dist`. Их можно отдавать через Nginx / Express / статический хостинг.

## Деплой на один сервер (пример Timeweb VPS)

1. **Установить зависимости на сервере:**
   ```bash
   apt update && apt upgrade -y
   apt install -y git curl build-essential nginx
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   npm install -g pm2
   ```

2. **Клонировать проект:**
   ```bash
   git clone https://github.com/<user>/<repo>.git /var/www/max_project
   ```

3. **Настроить бэкенд:**
   ```bash
   cd /var/www/max_project/server
   npm install
   cp .env.example .env   # или создать вручную
   pm2 start server.js --name max-backend
   pm2 save
   pm2 startup            # выполнить команду из вывода
   ```

4. **Собрать фронтенд:**
   ```bash
   cd ../max-webapp
   npm install
   VITE_API_BASE_URL=/api npm run build
   ```

5. **Настроить Nginx (`/etc/nginx/sites-available/max-webapp`):**
   ```nginx
   server {
     listen 80;
     server_name example.com;

     root /var/www/max_project/max-webapp/dist;
     index index.html;

     location /api {
       proxy_pass http://127.0.0.1:3001;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }

     location / {
       try_files $uri /index.html;
     }
   }
   ```

6. **Включить конфиг и перезапустить Nginx:**
   ```bash
   ln -s /etc/nginx/sites-available/max-webapp /etc/nginx/sites-enabled/
  nginx -t
   systemctl reload nginx
   ```

7. **(Опционально) настроить HTTPS через Certbot.**

## Обновление production

```bash
cd /var/www/max_project
git pull

cd server
npm install
pm2 reload max-backend

cd ../max-webapp
npm install
VITE_API_BASE_URL=/api npm run build

systemctl reload nginx
```

## Диагностика

- `pm2 logs max-backend` — логи бэкенда.
- `tail -f /var/log/nginx/error.log` — ошибки Nginx.
- `curl http://localhost:3001/health` — проверка API.
- Если фронтенд выдаёт `Failed to fetch`, убедитесь, что `ALLOWED_ORIGINS` на бэке содержит `http://localhost:3000`, а Vite запущен на этом порту (strictPort).

## Лицензия

Проект распространяется на условиях лицензии MIT (если требуется иное — укажите здесь).  
© 2025 MAX WebApp.


