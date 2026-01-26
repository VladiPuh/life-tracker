# LifeTracker — Канон проекта (v1.1)

## 1. Назначение

LifeTracker — это Telegram Mini App для отслеживания личных челенджей и ежедневного прогресса.
Проект изначально строится с приоритетом качества, стабильности и долгосрочной поддержки, а не скорости.

Основные цели:

- Бесшовный опыт использования **Telegram Mini App** (PROD)
- Чёткое разделение frontend (Mini App) и backend (API)
- Минимальная сложность инфраструктуры
- Production‑готовая HTTPS‑инфраструктура и корректная авторизация через Telegram

Web‑доступ вне Telegram рассматривается **исключительно как отладочный**.

---

## 2. Архитектура высокого уровня

```
Telegram Client
   |
   | открывает WebApp
   v
https://api.lifetracker.site/app/
   |
   | fetch('/api/*')  + X-Telegram-Init-Data
   v
FastAPI (127.0.0.1:8000)
   |
   v
SQLite (life_tracker.db)
```

Стратегия одного домена:

- Нет CORS‑проблем
- Нет Cloudflare / ngrok
- Прямой VPS‑хостинг

---

## 3. Домены и сеть

- Основной домен: lifetracker.site
- API + Mini App: api.lifetracker.site
- HTTPS: Let’s Encrypt (авто‑обновление)

Маршрутизация nginx:

- `/app/` → статический frontend (Vite build, Telegram Mini App)
- `/api/` → reverse proxy в FastAPI
- `/.well-known/acme-challenge/` → валидация Let’s Encrypt

---

## 4. Frontend (Telegram Mini App)

### Стек

- React
- TypeScript
- Vite
- Telegram WebApp SDK

### Исходники (локально)

```
D:\Life-Tracker\apps\webapp
├─ src/
├─ public/
├─ dist/        (production build)
└─ vite.config.ts
```

### Ключевые решения

- `base: '/app/'` в конфиге Vite
- Отсутствие абсолютных URL для API
- Доступ к API только через относительные пути `/api/*`
- Frontend полностью статический
- Получение Telegram initData **централизовано через функцию `getInitData()`**
- Любые API‑запросы выполняются **только если `tgOk === true`**

### Размещение на сервере

```
/var/www/api/app/
├─ index.html
├─ assets/
└─ tg_probe.html
```

Публичный URL:

- https://api.lifetracker.site/app/

---

## 5. Backend (API)

### Стек

- Python 3.10
- FastAPI
- Uvicorn
- SQLite
- SQLAlchemy (async)
- APScheduler

### Исходники (локально)

```
D:\Life-Tracker\apps\api
├─ app/
│  ├─ main.py
│  ├─ models.py
│  ├─ schemas.py
│  ├─ settings.py
│  └─ auth.py
├─ life_tracker.db
└─ requirements.txt
```

### Размещение на сервере

```
/opt/lifetracker/api
├─ app/
├─ life_tracker.db
├─ requirements.txt
├─ .env
└─ .venv/
```

API слушает:

- 127.0.0.1:8000 (только локально)

Публичный доступ:

- https://api.lifetracker.site/api/*

---

## 6. Авторизация (канон)

### PROD (основной режим)

- Источник идентификации: **Telegram WebApp initData**
- Передача: HTTP‑заголовок `X-Telegram-Init-Data`
- Проверка: `verify_telegram_init_data`

Поведение:

- Запрос без `X-Telegram-Init-Data` → **401 Unauthorized** (НОРМА)
- Запрос из браузера / curl → **401 Unauthorized** (НОРМА)

### DEV (режим разработки)

- Фиксированный пользователь
- initData не требуется
- Используется только локально

Переключение режимов:

- через `.env`
- без изменения кода

---

## 7. nginx (фактический)

```nginx
location /app/ {
    alias /var/www/api/app/;
    try_files $uri $uri/ /app/index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:8000/;
}
```

Роль nginx:

- TLS / HTTPS
- Раздача статики
- Reverse proxy

nginx **не содержит бизнес‑логики**.

---

## 8. Текущее состояние системы

### Работает

- Инфраструктура (VPS, nginx, HTTPS)
- Telegram Mini App открывается
- Telegram initData корректно приходит
- Backend валидирует initData
- `/api/today` стабильно возвращает данные

### Известная проблема (АКТУАЛЬНО)

- В Telegram Mini App при нажатии **«Показать все»** список челенджей не отображается
- При этом:
  - `tgOk === true`
  - `todayFetchState === 'json ok'`
  - backend возвращает корректный `today.all`

Проблема признана **исключительно frontend‑логической (UI / условия рендера)**.
Backend и авторизация исключены.

---

## 9. Рабочий процесс

### Локальная разработка

- Frontend: `npm run dev`
- Backend: `uvicorn app.main:app --reload`
- API_BASE: относительный (`/api`)

### Деплой

1. Сборка фронта (`npm run build`)
2. Загрузка `dist` → `/var/www/api/app`
3. Загрузка backend → `/opt/lifetracker/api`
4. Запуск uvicorn (в перспективе — systemd)

---

## 10. Явные не‑цели

- Нет Cloudflare
- Нет serverless
- Нет мульти‑регионов
- Нет преждевременного масштабирования
- Нет внешних хостингов фронта

---

## 11. Принципы (Канон)

1. Качество > скорость
2. Один шаг за раз
3. Минимум движущихся частей
4. Один домен — один источник истины
5. Устраняем причину, не симптом
6. Инфраструктура должна быть скучной

---

## 12. Следующий каноничный шаг

- Разбор UI‑логики кнопки «Показать все»
- Проверка условий рендера списка `today.all`
- Без изменений backend и инфраструктуры

---

## 13. Планы, цели, развитие, возможные улучшения

- Отдельный бот в телеграм для старта/стопа/сердцебиения сервера
- Fullscreen-режим Mini App при запуске

---

Конец документа.
