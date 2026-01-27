# LifeTracker CANON v2.2 (RU)

## Single Source of Truth (SSOT)

Дата обновления: 27.01.2026

---

## 1. Статус проекта (PROD)

### Frontend

- Telegram Mini App (Main App / Fullscreen)
- Авторизация через Telegram initData — подтверждена
- API_BASE = /api
- PROD путь: /var/www/html/app
- Деплой: deploy_frontend.ps1 (SSH + backup + dist.tar.gz)
- Архитектура v2.1 завершена:
  - features/\*
  - state/\*
  - shared/\*
  - App.tsx = тонкий shell (навигация + эффекты)
- UX баг iOS зафиксирован, сознательно отложен

### Backend

- FastAPI
- PROD путь: /opt/lifetracker/api
- DB: life_tracker.db (SQLite)
- Service: systemd unit lifetracker-api.service
- ExecStart: uvicorn app.main:app --host 127.0.0.1 --port 8000
- Health:
  - internal: http://127.0.0.1:8000/health
  - external: https://api.lifetracker.site/api/health
- Nginx proxy:
  - https://api.lifetracker.site/api/_ → 127.0.0.1:8000/_

---

## 2. Backend package-cleanup (Этап 1.5) — ЗАВЕРШЁН

### Выполнено

- main.py приведён к роли app-shell
- Вынесены роуты:
  - routers/health.py
  - routers/dev.py
  - routers/templates.py
  - routers/today.py
  - routers/daily_log.py
  - routers/history.py
  - routers/challenges.py
- Telegram auth изолирован в core/auth.py
- State/logic вынесены в services/\*
- main.py:
  - только FastAPI init
  - middleware
  - startup hooks
  - include_router
- Поведение API НЕ изменено

### SRE / Ops

- Восстановлен и зафиксирован PROD запуск backend
- Введён systemd сервис lifetracker-api
- Деплой backend:
  - backup code + db
  - replace code
  - systemctl restart lifetracker-api
  - health-check по api.lifetracker.site
- Health-check URL в deploy_backend.ps1 исправлен
- PROD деплой pipeline подтверждён как рабочий

---

## 3. Безопасность

- Обнаружена и устранена утечка Telegram Bot Token
- Токен ротирован через BotFather
- История git переписана (git-filter-repo)
- SERVER_SNAPSHOT добавлен в .gitignore
- Секреты в git-истории удалены

---

## 4. Текущий SSOT запуска (обязателен)

- Backend запускается ТОЛЬКО через:
  - systemd: lifetracker-api.service
- Ручные / nohup / ngrok запуски — запрещены
- Любой деплой = restart systemd + health-check

---

## 5. Следующий этап (НЕ НАЧАТ)

### Этап 1.6 — Backend Core Split

Цель:

- разделить domain / services / repositories
- подготовить тестируемость
- сохранить поведение

Первый шаг:

- 1.6.1 — диагностика backend-пакетов as-is

---

## 6. Принципы работы

- Один шаг за раз
- Архитектура важнее симптомов
- Никаких UX правок до завершения backend-архитектуры
- Канон обновляется при каждом значимом этапе
- Этот документ — SSOT

---
