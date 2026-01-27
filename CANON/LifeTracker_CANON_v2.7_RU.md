# LifeTracker CANON v2.7 (RU)

## Single Source of Truth (SSOT)

Дата обновления: 27.01.2026  
Таймзона: Europe/Vilnius  
Формат работы: **один шаг за раз** → диагностика → изменения → фиксация в каноне.

---

## 0. Правило обновления канона

Канон — **единственный источник истины (SSOT)**.  
Любые решения, изменения и деплой **обязаны** сверяться с этим файлом.

Обновлять при каждом значимом шаге:

- **0.1 Журнал изменений**
- **0.2 Текущее состояние**
- при необходимости — разделы PROD / Архитектура / Деплой

---

## 0.1 Журнал изменений (Changelog)

- **27.01.2026 — Этап 1.6 (Backend Core Split) завершён и задеплоен на PROD**
- **27.01.2026 — Этап 1.7 (Backend Deploy) выполнен, health-check OK**
- **27.01.2026 — Этап 1.8 (Post-deploy стабилизация) завершён**
- **27.01.2026 — Этап 1.9 (Observability & Guards) завершён и проверен на PROD:**
  - единое логирование подключено и задеплоено
  - добавлены Guards (SQL-инварианты)
  - smoke-check обновлён: запускает guards
  - проверка на PROD: `GUARDS OK` / `SMOKE OK`

---

## 0.2 Текущее состояние (What is true now)

- Backend **в репозитории и на PROD** соответствует архитектуре  
  `routers → services → repositories → db`
- SQL разрешён **только** в `repositories/*`
- Backend на PROD:
  - запущен строго через `systemd`
  - стабилен после рестартов
  - health-check стабильно `OK`
  - логирование унифицировано
- Smoke-check подтверждает, что приложение корректно импортируется и поднимается (через venv)
- Guards подтверждают инвариант: raw SQL и `text()` вне `repositories/*` запрещены
- БД целостна, структура подтверждена
- Frontend PROD стабилен, работает через `/api`

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
    `/opt/lifetracker/api/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - Важно: `python` на Ubuntu может отсутствовать; используем `.venv/bin/python` / `python3`.

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
5. `.venv/bin/python -m compileall app`
6. `systemctl restart lifetracker-api`
7. Health-check (internal + external)
8. Smoke-check (`.venv/bin/python -m app._smoke`)
9. Фиксация в каноне

---

### 2.3 Post-deploy стабилизация (Этап 1.8)

Подтверждено:

- `journalctl` без ошибок
- health-check под серией запросов
- ключевые API отвечают корректно
- БД проверена через python (`sqlite3`)

---

## 3. Observability & Guards (Этап 1.9)

### 3.1 Логирование

- Подключён единый logging-конфиг:
  - файл: `app/core/logging.py`
  - инициализация в `main.py`
- Формат логов читаем в `journalctl`
- Логирование подтверждено на PROD

### 3.2 Smoke-check

- Файл: `app/_smoke.py`
- Проверка:
  ```bash
  cd /opt/lifetracker/api
  .venv/bin/python -m app._smoke
  ```
- Результат на PROD: **GUARDS OK / SMOKE OK**

Назначение: быстрый контроль импорта и старта приложения после деплоя.

### 3.3 Guards (SQL-инварианты)

- Файл: `app/_guards.py`
- Назначение: автоматическая проверка инварианта **«SQL только в repositories/\*»**:
  - запрет `sqlalchemy.text(...)` и `text(...)` вне `repositories/*`
  - запрет raw SQL-строк (паттерны `SELECT … FROM`, `INSERT INTO`, `UPDATE … SET`, `DELETE FROM`, `CREATE/DROP/ALTER TABLE`) вне `repositories/*`
- Интеграция: запускаются из smoke-check (`app/_smoke.py`)

Проверка на PROD:

```bash
cd /opt/lifetracker/api
.venv/bin/python -m app._smoke
```

Ожидаемо: `GUARDS OK` затем `SMOKE OK`.

---

## 4. Архитектура backend (SSOT)

### 4.1 Каноническое разделение слоёв

- `routers/*` — HTTP слой  
  ❌ SQL запрещён
- `services/*` — бизнес-логика  
  ❌ SQL запрещён
- `repositories/*` — доступ к БД  
  ✅ SQL разрешён
- `db.py` — engine + session + `get_db`
- `core/*` — auth / config / infra

**Инвариант:** SQL существует только в `repositories`.

---

## 5. Этапы проекта (актуально)

- **1.5 — Backend package-cleanup** — завершён
- **1.6 — Backend Core Split** — завершён
- **1.7 — Backend Deploy** — завершён
- **1.8 — Post-deploy стабилизация** — завершён
- **1.9 — Observability & Guards** — завершён (GUARDS+SMOKE OK на PROD)

---

## 6. Принципы работы (обязательные)

- Один шаг за раз
- Диагностика → код → фиксация
- Архитектура важнее симптомов
- Канон = SSOT

---

## 7. Следующий фокус после v2.6

- наблюдение в проде (журнал/health/smoke)
- углубление SQL-инвариантов (при необходимости)
- подготовка новых backend-фич
