# LifeTracker CANON v2.4 (RU)

## Single Source of Truth (SSOT)

Дата обновления: 27.01.2026  
Таймзона: Europe/Vilnius  
Формат работы: **один шаг за раз** → диагностика → изменения → фиксация в каноне.

---

## 0. Правило обновления канона

Канон — **единственный источник истины (SSOT)**.

При каждом значимом шаге обязательно обновлять:
- **0.1 Журнал изменений**
- **0.2 Текущее состояние**
- при необходимости — разделы **PROD / Архитектура / Деплой**

---

## 0.1 Журнал изменений (Changelog)

- **27.01.2026 — Этап 1.6 (Backend Core Split) завершён и ЗАДЕПЛОЕН на PROD**
- **27.01.2026 — Этап 1.7 (Backend Deploy) выполнен, health-check OK**

---

## 0.2 Текущее состояние (What is true now)

- Backend **в репозитории и на PROD** соответствует архитектуре  
  `routers → services → repositories → db`
- SQL разрешён **только** в `repositories/*`
- Backend на PROD обновлён, запущен через `systemd`, health-check пройден
- Frontend PROD стабилен, работает с `/api`, Telegram initData подтверждена

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
- UX-баг iOS: зафиксирован, **осознанно отложен**

---

### 1.2 Backend (FastAPI)

- PROD путь: `/opt/lifetracker/api`
- Backend app: `/opt/lifetracker/api/app`
- DB: `life_tracker.db` (SQLite)
- Запуск: **только systemd**
  - service: `lifetracker-api.service`
  - ExecStart:  
    `uvicorn app.main:app --host 127.0.0.1 --port 8000`

#### Health
- internal: `http://127.0.0.1:8000/health`
- external: `https://api.lifetracker.site/api/health`
- Статус: **OK**

#### Nginx
- `https://api.lifetracker.site/api/*` → `127.0.0.1:8000/*`

---

## 2. Деплой и эксплуатация (SRE)

### 2.1 Запрещено

- Запуск backend не через systemd
- Изменения на PROD без backup и фиксации в каноне
- Прямой SQL вне `repositories`

---

### 2.2 Backend deploy pipeline (актуальный)

Используется **archive-based deploy** (PROD без git):

1. Backup кода (`tar.gz`) и БД
2. Заливка архива backend (`app/`)
3. Атомарная замена `api/app`
4. `python -m compileall`
5. `systemctl restart lifetracker-api`
6. Health-check (internal + external)
7. Фиксация в каноне

---

### 2.3 Frontend deploy pipeline

- `deploy_frontend.ps1`:
  - backup
  - upload dist
  - smoke-check в Telegram

---

## 3. Безопасность

- Утечка Telegram Bot Token — **закрыта**
- Токен ротирован
- Git-история очищена (`git-filter-repo`)
- `_SERVER_SNAPSHOT/`, `__pycache__/`, `*.pyc`, `_TREE_*.txt` — в `.gitignore`

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

## 5. Этапы проекта

### 5.1 Этап 1.5 — Backend package-cleanup — ЗАВЕРШЁН

- main.py = app-shell
- routers вынесены
- auth изолирован
- services выделены
- поведение API сохранено

---

### 5.2 Этап 1.6 — Backend Core Split — ЗАВЕРШЁН

- SQL удалён из routers и services
- repositories добавлены
- auto_assign, today, templates, history, challenges, daily_log разнесены
- архитектура выровнена

---

### 5.3 Этап 1.7 — Backend Deploy — ЗАВЕРШЁН

- PROD обновлён до архитектуры 1.6
- `repositories/*` присутствуют на сервере
- systemd перезапуск успешен
- health-check OK (internal + external)

---

## 6. Принципы работы (обязательные)

- Один шаг за раз
- Диагностика → код → фиксация
- Архитектура важнее симптомов
- Никаких UX-правок до backend-стабилизации
- Канон = SSOT

---

## 7. Следующий шаг (после 2.4)

- стабилизация / тесты
- подготовка к новым фичам
- либо этап 1.8 (по отдельному решению)
