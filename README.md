[![Deploy Frontend to Server](https://github.com/ilya1981/cloud_storage/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/ilya1981/cloud_storage/actions/workflows/deploy-frontend.yml)
# Облачное хранилище файлов (Cloud Storage)

**Дипломный проект:** Fullstack-приложение для загрузки, хранения и управления файлами с разграничением прав пользователей.

## Стек технологий

- **Backend:** Python 3.12, Django 5.2.1, Django REST Framework 3.15.0
- **База данных:** PostgreSQL
- **WSGI-сервер:** Gunicorn (3 воркера)
- **Reverse proxy:** Nginx
- **Frontend:** React + Vite 8.1.2, Material-UI
- **CI/CD:** GitHub Actions (автоматический деплой при пуше в `main`)
- **Хостинг:** VPS на Reg.ru (Ubuntu 24.04/26.04 LTS)

> ⚠️ **Важно:** Проект требует VPS (виртуальный сервер). Обычный веб-хостинг (shared hosting) в Рег.ру не подойдёт: там нельзя запустить Gunicorn, управлять systemd-сервисами и использовать PostgreSQL полноценно.

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

## Локальный запуск (для разработки)

#### Требования
- Python 3.10–3.12
- Node.js 20+
- PostgreSQL (локально или в Docker)

#### Backend (Django)

bash
#### Клонирование
git clone <URL_РЕПОЗИТОРИЯ>
cd cloud_storage

#### Виртуальное окружение
python -m venv env
source env/bin/activate  # Windows: env\Scripts\activate

#### Установка зависимостей
pip install -r requirements.txt

#### Настройка переменных окружения
cp .env.example .env
#### Отредактируй .env: укажи DB_NAME, DB_USER, DB_PASSWORD, SECRET_KEY и т.д.

#### Миграции и суперпользователь
python manage.py migrate
python manage.py createsuperuser

#### Запуск сервера
python manage.py runserver 8000

API будет доступно по адресу: http://localhost:8000/api/

#### Frontend (React + Vite)
В отдельной папке (или в подпапке frontend):
- cd frontend
-npm install
-npm run dev
Фронтенд будет доступен по адресу: http://localhost:5173/

## Развёртывание на VPS (Reg.ru)
   
#### 1. Заказ и вход
В панели Reg.ru закажите VPS (Linux, Ubuntu 24.04 или 26.04, минимум 2 ГБ RAM).
Получите IP-адрес и root-пароль (или SSH-ключ).
Зайдите на сервер:



