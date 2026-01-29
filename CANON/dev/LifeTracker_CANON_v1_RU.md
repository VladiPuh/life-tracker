# LifeTracker — Канон проекта (v1.0)

## 1. Назначение

LifeTracker — это Telegram Mini App для отслеживания личных челенджей и ежедневного прогресса.
Проект изначально строится с приоритетом качества, стабильности и долгосрочной поддержки, а не скорости.

Основные цели:

- Бесшовный опыт использования Telegram Mini App
- Чёткое разделение frontend (Mini App) и backend (API)
- Минимальная сложность инфраструктуры
- Production‑готовая HTTPS‑инфраструктура и базовая безопасность

---

## 2. Архитектура высокого уровня

```
Telegram Client
   |
   | открывает WebApp
   v
https://api.lifetracker.site/app/
   |
   | fetch('/api/*')
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

- `/app/` → статический frontend (Vite build)
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
- SQLAlchemy
- APScheduler

### Исходники (локально)

```
D:\Life-Tracker\apps\api
├─ app/
│  ├─ main.py
│  ├─ models.py
│  ├─ schemas.py
│  └─ settings.py
├─ life_tracker.db
└─ requirements.txt
```

### Размещение на сервере

```
/opt/lifetracker/api
├─ app/
├─ life_tracker.db
├─ requirements.txt
└─ .venv/
```

API слушает:

- 127.0.0.1:8000 (только локально)

Публичный доступ:

- https://api.lifetracker.site/api/*

---

## 6. nginx (концептуально)

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

## 7. Базовая безопасность

- Везде HTTPS
- Нет открытых портов API наружу
- FastAPI привязан к localhost
- SSH‑доступ только по ключам
- Нет секретов во фронте

В перспективе:

- Проверка Telegram initData
- Rate limiting
- systemd‑изоляция

---

## 8. Рабочий процесс

### Локальная разработка

- Frontend: `npm run dev`
- Backend: `uvicorn app.main:app --reload`
- API_BASE: относительный (`/api`)

### Деплой

1. Сборка фронта (`npm run build`)
2. Загрузка `dist` → `/var/www/api/app`
3. Загрузка backend → `/opt/lifetracker/api`
4. Перезапуск API (в будущем — systemd)

---

## 9. Явные не‑цели

- Нет Cloudflare
- Нет serverless
- Нет мульти‑регионов
- Нет преждевременного масштабирования
- Нет внешних хостингов фронта

---

## 10. Принципы (Канон)

1. Качество > скорость
2. Один шаг за раз
3. Минимум движущихся частей
4. Один домен — один источник истины
5. Устраняем причину, не симптом
6. Инфраструктура должна быть скучной

---

## 11. Текущий статус

- Инфраструктура: готово
- HTTPS: готово
- Mini App открывается: готово
- API связано с фронтом: готово
- SSH‑доступ без пароля: готово

Система стабильна и готова к развитию функционала.

---

## 12. Следующие каноничные шаги

- Привязка WebApp в BotFather
- Проверка Telegram initData
- systemd‑сервис для FastAPI
- Бэкапы SQLite
- Расширение логики челенджей
- Допиливание UX|UI внутри приложения в Telegram

---

Конец документа.
