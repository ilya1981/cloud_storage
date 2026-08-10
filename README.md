[![Deploy Frontend to Server](https://github.com/ilya1981/cloud_storage/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/ilya1981/cloud_storage/actions/workflows/deploy-frontend.yml)
### Облачное хранилище файлов (дипломный проект)

Инструкция по локальной установке и запуску проекта на Windows в среде MINGW64: Django 5.2.1 + DRF + PostgreSQL + Vite + React + Material‑UI.

Требования к окружению
ОС: Windows 10/11
Терминал: MINGW64 (Git Bash)
Python: 3.12+ (проверь: python --version или python3 --version)
Node.js: 20+ (проверь: node -v)
PostgreSQL: 14+ (локальная установка, pgAdmin или консольный клиент)
Инструменты: pip, npm, ruff, bla
### Структура проекта:
```text
cloud_storage/                 # Корень репозитория
├── .gitignore
├── README.md
├── manage.py
├── requirements.txt           # Базовые зависимости бэкенда
├── requirements-dev.txt       # Линтеры, тесты, dev-зависимости
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD пайплайн (GitHub Actions)
├── accounts/                    # Django-приложение: пользователи, регистрация, админка
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   └── serializers.py
├── files/                       # Django-приложение: файлы, загрузка, ссылки
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── serializers.py
│   └── permissions.py
├── cloud_storage/               # Проектные настройки Django (settings, urls, wsgi/asgi)
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
└── frontend/                    # React + Vite
    ├── .eslintrc.cjs
    ├── index.html
    ├── package.json
    ├── public/
    │   └── favicon.ico
    ├── dist/                    # Результат сборки (не коммитить)
    ├── node_modules/            # Не коммитить
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── store/               # Redux
        │   ├── store.js
        │   └── slices/
        ├── services/            # API-запросы
        │   └── api.js           # baseURL: http://localhost:8000/api/
        ├── components/          # Переиспользуемые UI-компоненты
        │   ├── Dashboard.jsx
        │   ├── FileTable.jsx
        │   └── PrivateRoute.jsx
        ├── pages/               # Страницы
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── AdminPanel.jsx
        └── utils/               # Вспомогательные функции
            └── formatSize.js
            ```

1. Клонируем репозиторий
в bash
git clone <https://github.com/ilya1981/cloud_storage> cloud_storage
cd cloud_storage

2. Создаём и активируем виртуальное окружение

в bash
python -m venv venv
source venv/bin/activate

3. Устанавливаем зависимости бэкенда

в bash
pip install -r requirements.txt
### или для расширенного набора (линтеры, тесты)

pip install -r requirements-dev.txt

### 4. Настраиваем базу данных

Установаем PostgreSQL и создай базу cloud_storage_db (через pgAdmin или CLI).
Создаём пользователя с правами на эту БД.

SECRET_KEY=твой_секретный_ключ_django
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/cloud_storage_db
ALLOWED_HOSTS=127.0.0.1,localhost
CSRF_COOKIE_SECURE=False
SESSION_COOKIE_SECURE=False

### 5. Применим миграции Django

python manage.py migrate

### Настройка фронтенда (в MINGW64)

Перейдём в папку фронтенда:

bash
cd frontend
Установим зависимости:

bash
npm install
Проверим, что в vite.config.js настроен корректный порт (по умолчанию Vite поднимает на 5173).

Убедимся, что в файле src/services/api.js указан правильный baseURL:

js
const baseURL = 'http://localhost:8000/api/';
Вернёмся в корень проекта:

bash
cd ..

### Запуск проекта (два терминала в MINGW64)

Терминал 1 — бэкенд:
ss
bash
python manage.py runserver 8000
Сервер будет доступен по http://localhost:8000. API — по http://localhost:8000/api/.

Терминал 2 — фронтенд:

Откроем новый терминал MINGW64, перейдём в папку frontend и запустим:

bash
cd frontend
npm run dev
Фронтенд будет доступен по http://localhost:5173.

### Проверка CORS и CSRF (важно для MINGW64 / Windows)

В cloud_storage/settings.py должны быть:

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... остальные middleware, включая CsrfViewMiddleware
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

CSRF‑токен читается из куки и автоматически добавляется в заголовок X-CSRFToken (логика в frontend/src/utils/csrf.js и api.js). Не отключаем CSRF — это требование безопасности.


### Развёртывание на reg.ru 

### Подготовка артефактов

1. Сборка фронтенда:

npm ci
npm run build

2. Сбор статических файлов Django: 

python manage.py collectstatic --noinput


3. Миграции:
   
python manage.py migrate --noinput

4. Создание суперпользователя (если нужно):
   
python manage.py createsuperuser --noinput  # с передачей аргументов через env

Требования к деплою на reg.ru
Использовать WSGI/uWSGI или Gunicorn + Nginx.
Папка staticfiles/ должна быть доступна по /static/.
Папка media/ — по /media/.
Переменные окружения — через панель хостинга или .env.
База данных — PostgreSQL (на хостинге или внешняя).


### Как повторно развернуть приложение без участия разработчика
Инструкция рассчитана на опытного ИТ‑специалиста:

Клонировать репозиторий.
Установить Python, Node.js, PostgreSQL.
Настроить .env с реальными значениями.
Выполнить миграции и сборку фронтенда.
Настроить веб‑сервер (Nginx + Gunicorn/uWSGI).
Запустить приложение.
Все зависимости и шаги описаны выше. Никаких скрытых инструментов или недокументированных зависимостей нет.
