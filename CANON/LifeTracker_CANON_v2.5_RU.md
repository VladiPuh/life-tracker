# LifeTracker CANON v2.5 (RU)

## Single Source of Truth (SSOT)

Дата обновления: 27.01.2026  
Таймзона: Europe/Vilnius  
Формат работы: **один шаг за раз** → диагностика → изменения → фиксация в каноне.

---

## 0. Правило обновления канона

Канон — **единственный источник истины (SSOT)**.  
Любые решения, изменения и деплой **сверяются с этим файлом**.

При каждом значимом шаге обновлять:
- **0.1 Журнал изменений**
- **0.2 Текущее состояние**
- при необходимости — разделы PROD / Архитектура / Деплой

---

## 0.1 Журнал изменений (Changelog)

- **27.01.2026 — Этап 1.6 (Backend Core Split) завершён и задеплоен на PROD**
- **27.01.2026 — Этап 1.7 (Backend Deploy) выполнен, health-check OK**
- **27.01.2026 — Этап 1.8 (Post-deploy стабилизация) завершён, инварианты подтверждены**

---

## 0.2 Текущее состояние (What is true now)

- Backend **в репозитории и на PROD** соответствует архитектуре  
  `routers → services → repositories → db`
- SQL разрешён **только** в `repositories/*`
- Backend на PROD:
  - запущен через `systemd`
  - стабилен под нагрузкой health-check
  - API-эндпоинты отвечают корректно
- БД целостна, схема подтверждена
- Frontend PROD стабилен, работает с `/api`

---

## 1. PROD — Текущее состояние

### 1.1 Frontend (Telegram Mini App)

- Формат: Telegram Mini App (Main App / Fullscreen)
- Авторизация: Telegram initData — подтверждена
- API_BASE = `/api`
- PROD путь: `/var/www/html/app`
- Деплой: `deploy_frontend.ps1`
- Архитектура фронта v2.1:
  - `features/*`
  - `state/*`
  - `shared/*`
  - `App.tsx` = тонкий app-shell
- UX-баг iOS: зафиксирован, осознанно отложен

---

### 1.2 Backend (FastAPI)

- PROD путь: `/opt/lifetracker/api`
- Backend app: `/opt/lifetracker/api/app`
- DB: `life_tracker.db` (SQLite)
- Запуск: **строго через systemd**
  - service: `lifetracker-api.service`
  - ExecStart:  
    `uvicorn app.main:app --host 127.0.0.1 --port 8000`

#### Health
- internal: `http://127.0.0.1:8000/health`
- external: `https://api.lifetracker.site/api/health`
- Статус: **OK (проверено серией запросов)**

#### Nginx
- `https://api.lifetracker.site/api/*` → `127.0.0.1:8000/*`

---

## 2. Деплой и эксплуатация (SRE)

### 2.1 Запрещено

- Запуск backend не через systemd
- Изменения на PROD без backup
- Прямой SQL вне `repositories`
- UX-правки до backend-стабилизации

---

### 2.2 Backend deploy pipeline (актуальный)

Используется **archive-based deploy** (PROD без git):

1. Backup backend-кода (`tar.gz`)
2. Backup БД (`life_tracker.db`)
3. Заливка архива backend (`app/`)
4. Атомарная замена `api/app`
5. `python -m compileall`
6. `systemctl restart lifetracker-api`
7. Health-check (internal + external)
8. Фиксация в каноне

---

### 2.3 Post-deploy стабилизация (Этап 1.8)

Выполнено и подтверждено:
- `journalctl` без ошибок и traceback
- Health-check (10 запросов подряд) — OK
- Проверка ключевых API (`/health`, `/today`) — OK
- Проверка БД через python (`sqlite3`):
  - таблицы: `users`, `challenges`, `daily_log`, `challenge_templates`
- Утилита `sqlite3` на сервере отсутствует — **использовать python для DB-check**

---

## 3. Безопасность

- Утечка Telegram Bot Token — закрыта
- Токен ротирован
- Git-история очищена (`git-filter-repo`)
- В `.gitignore`:
  - `_SERVER_SNAPSHOT/`
  - `__pycache__/`, `*.pyc`
  - `_TREE_*.txt`, `_TEMPLATES_INPUT.txt`, `_AUTO_ASSIGN_INPUT.txt`

---

## 4. Архитектура backend (SSOT)

### 4.1 Каноническое разделение слоёв

- `routers/*` — HTTP слой  
  ❌ SQL запрещён
- `services/*` — бизнес-логика / use-cases  
  ❌ SQL запрещён
- `repositories/*` — доступ к БД  
  ✅ SQL разрешён
- `db.py` — engine + session + `get_db`
- `core/*` — auth / security / config (DB только через repo)

**Инвариант:** SQL существует только в `repositories`.

---

### 4.2 Актуальная структура backend (локально и PROD)

```
app/
├─ core/
├─ routers/
├─ services/
├─ repositories/
├─ db.py
├─ main.py
├─ models.py
├─ schemas.py
└─ settings.py
```

---

## 5. Этапы проекта (актуально)

- **1.5 — Backend package-cleanup** — завершён
- **1.6 — Backend Core Split** — завершён
- **1.7 — Backend Deploy** — завершён
- **1.8 — Post-deploy стабилизация** — завершён

---

## 6. Принципы работы (обязательные)

- Один шаг за раз
- Диагностика → код → фиксация
- Архитектура важнее симптомов
- Канон = SSOT

---

## 7. Следующий этап (после v2.5)

- тесты / наблюдение
- подготовка новых backend-фич
- дальнейшие этапы фиксируются отдельным решением
