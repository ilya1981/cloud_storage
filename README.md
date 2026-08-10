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
в bash
    
    ssh root@<IP_ВАШЕГО_VPS>

#### 2. Подготовка системы и создание пользователя

        apt update && apt upgrade -y
        apt install -y python3-pip python3-venv git nginx postgresql postgresql-contrib build-essential libpq-dev
        adduser user
        usermod -aG sudo user
        su - user

#### 3. Настройка PostgreSQL

        sudo -u postgres psql

Внутри консоли PostgreSQL:

        CREATE USER ilya WITH PASSWORD 'ваш_сложный_пароль';
        CREATE DATABASE cloud_storage OWNER user;
        GRANT ALL PRIVILEGES ON DATABASE cloud_storage TO user;
        \q

В settings.py укажите:

        DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'cloud_storage',
        'USER': ,
        'PASSWORD': 'ваш_сложный_пароль',
        'HOST': 'localhost',
        'PORT': '5432',
    }
    }

#### 4. Клонирование проекта и установка зависимостей

        cd ~
        git clone https://github.com/ilya1981/cloud_storage
        cd cloud_storage
        python3 -m venv env
        source env/bin/activate
        pip install -r requirements.txt


#### 5. Миграции и первый запуск

        python manage.py migrate
        python manage.py createsuperuser

Проверьте, что приложение запускается без ошибок:

       env/bin/gunicorn --bind 127.0.0.1:8001 cloud_storage.wsgi:application

#### 6. Настройка systemd-сервиса для Gunicorn

        sudo nano /etc/systemd/system/cloud_storage.service

Вставьте в cloud_storage.service:

        [Unit]
        Description=Gunicorn daemon for cloud_storage (Django 5.2.1)
        After=network.target

        [Service]
        User=user
        Group=user
        WorkingDirectory=/home/user/cloud_storage
        ExecStart=/home/user/cloud_storage/env/bin/gunicorn --access-logfile - --workers 3 --bind 127.0.0.1:8001 cloud_storage.wsgi:application
        Restart=always

        [Install]
        WantedBy=multi-user.target

#### Активируйте сервис:

        sudo systemctl daemon-reload
        sudo systemctl enable cloud_storage
        sudo systemctl start cloud_storage
        sudo systemctl status cloud_storage --no-pager
Должно быть active (running).

#### 7. Настройка Nginx

Удалите дефолтный конфиг:

        sudo rm /etc/nginx/sites-enabled/default

Создайте конфиг:

        sudo nano /etc/nginx/sites-available/cloud_storage

Вставьте (замените 89.108.71.115 на ваш IP или домен после привязки):

        server {
    listen 80;
    server_name 89.108.71.115;

    location / {
        root /home/user/cloud_storage/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    }


Активация:

    sudo ln -s /etc/nginx/sites-available/cloud_storage /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx

#### 8. Настройка прав и переменных окружения

    chown -R user:user /home/user/cloud_storage
    chmod -R 755 /home/user/cloud_storage

Убедитесь, что файл .env лежит в /home/user/cloud_storage/.env и имеет корректные значения.

### Настройка CI/CD (GitHub Actions)

Для автоматического деплоя при пуше в ветку main убедитесь, что в GitHub Secrets добавлены
- SSH_PRIVATE_KEY — приватный SSH-ключ пользователя user (PEM-формат).
- SERVER_IP — IP-адрес вашего VPS (например, 89.108.71.115).
  Также на сервере должно быть правило sudo без пароля для перезапуска сервиса:

      echo "user ALL=(ALL) NOPASSWD: /user/bin/systemctl restart cloud_storage" | sudo tee -a /etc/sudoers

Проверка:

    sudo systemctl restart cloud_storage  # пароль запрашиваться не должен


    
