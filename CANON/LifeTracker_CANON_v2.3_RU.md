# LifeTracker CANON v2.3 (RU)

## Single Source of Truth (SSOT)

Дата обновления: 27.01.2026  
Таймзона: Europe/Vilnius  
Формат работы: **один шаг за раз** → сначала диагностика → потом изменения → затем фиксация в каноне.

---

## 0. Как обновлять канон (шаблон)

При каждом значимом шаге добавляй **одну строку** в:

- **0.1 Журнал изменений (Changelog)**
- **0.2 Текущее состояние (What is true now)**
- при необходимости — обновляй разделы “PROD”, “Архитектура”, “Деплой”.

### 0.1 Журнал изменений (Changelog)

- 27.01.2026 — **Этап 1.6 (Backend Core Split) завершён в репозитории**, PROD ещё требует деплоя backend-кода.

### 0.2 Текущее состояние (What is true now)

- Backend архитектура **в репозитории**: `routers → services → repositories → db` (SQL только в repositories).
- Backend на PROD: **ещё не обновлён** до структуры 1.6 (нет `app/repositories`, старые “fat routers/services”).
- Frontend PROD: работает, API_BASE=`/api`, initData auth подтверждена.

---

## 1. Статус проекта (PROD)

### 1.1 Frontend (Telegram Mini App)

- Формат: Telegram Mini App (Main App / Fullscreen)
- Авторизация: Telegram initData — подтверждена
- API_BASE = `/api`
- PROD путь: `/var/www/html/app`
- Деплой: `deploy_frontend.ps1` (SSH + backup + dist.tar.gz)
- Архитектура фронта v2.1 завершена:
  - `features/*`
  - `state/*`
  - `shared/*`
  - `App.tsx` = тонкий app-shell (навигация + эффекты)
- UX баг iOS: зафиксирован и **осознанно отложен** (до завершения backend-архитектуры)

### 1.2 Backend (FastAPI)

- PROD путь: `/opt/lifetracker/api`
- DB: `life_tracker.db` (SQLite)
- Запуск: **строго** через systemd:
  - unit: `lifetracker-api.service`
  - ExecStart: `uvicorn app.main:app --host 127.0.0.1 --port 8000`
- Health:
  - internal: `http://127.0.0.1:8000/health`
  - external: `https://api.lifetracker.site/api/health`
- Nginx proxy:
  - `https://api.lifetracker.site/api/*` → `127.0.0.1:8000/*`

---

## 2. Деплой и эксплуатация (SRE / Ops)

### 2.1 Запрещено

- Ручные / `nohup` / “временные” запуски backend — **запрещены**
- Любые изменения на PROD без фиксации шагов — запрещены

### 2.2 Backend deploy pipeline (формализован)

**Цель:** заменить код и не потерять БД.

Чеклист:

1. backup кода + БД
2. замена кода
3. `systemctl restart lifetracker-api`
4. health-check внешнего URL
5. фиксация результата в каноне

### 2.3 Frontend deploy pipeline (формализован)

- `deploy_frontend.ps1` делает: backup → заливка dist → перезапуск/перечистка (если есть) → smoke-check в Telegram.

---

## 3. Безопасность

- Инцидент: утечка Telegram Bot Token — **закрыт**
- Токен ротирован через BotFather
- Git-история переписана (`git-filter-repo`)
- `_SERVER_SNAPSHOT/` добавлен в `.gitignore`
- Секреты в истории удалены

---

## 4. Архитектура backend (SSOT)

### 4.1 Канонический слой (после 1.6)

- `routers/*` — HTTP слой (FastAPI endpoints).  
  **Запрещено:** `select(`, `db.execute`, прямые запросы к БД.
- `services/*` — use-cases / бизнес-логика.  
  **Запрещено:** `select(`, `db.execute` (только вызовы repo).
- `repositories/*` — DB access слой.  
  **Разрешено:** `select`, `db.execute`, SQLAlchemy queries.
- `db.py` — engine/session + `get_db()` dependency.
- `core/*` — auth/security/config без прямой DB-логики (DB через repositories).

Инвариант: **SQL существует только в repositories.**

### 4.2 Структура backend в репозитории (локально / git)

Актуальная структура (сокращённо):

- `app/core/auth.py`, `app/core/security.py`
- `app/routers/*` (тонкие)
- `app/services/*`:
  - `today_service.py`
  - `templates.py`
  - `history_service.py`
  - `challenges_service.py`
  - `daily_log_service.py`
  - `auto_assign.py`
  - `status.py`
- `app/repositories/*`:
  - `users_repo.py`
  - `challenges_repo.py`
  - `challenges_crud_repo.py`
  - `daily_logs_repo.py`
  - `daily_log_crud_repo.py`
  - `templates_repo.py`
  - `history_repo.py`
  - `auto_assign_repo.py`

### 4.3 Структура backend на PROD (сейчас)

На PROD пока:

- нет `app/repositories/*`
- `routers/*` и часть `services/*` ещё “fat” (с `db.execute/select`)

**Следствие:** чтобы “1.6 = true on PROD”, требуется backend деплой кодовой базы.

---

## 5. Этапы разработки

### 5.1 Этап 1.5 — Backend package-cleanup — ЗАВЕРШЁН

Выполнено:

- `main.py` приведён к роли app-shell
- Роуты вынесены в `routers/*`
- Telegram auth изолирован в `core/auth.py`
- Логика вынесена в `services/*`
- Поведение API не менялось
- Pipeline деплоя подтверждён

### 5.2 Этап 1.6 — Backend Core Split — ЗАВЕРШЁН (в репозитории)

Цель (как было):

- разделить **domain / services / repositories**
- повысить читаемость и тестируемость
- сохранить поведение

Факт выполнения (в git):

- из `routers/*` убран прямой SQL
- из `services/*` убран прямой SQL
- весь SQL вынесен в `repositories/*`
- `auto_assign` вынес DB в repo
- `templates/history/today/challenges/daily_log` разнесены по слоям
- добавлены игноры для локальных scratch файлов (`_TREE_*.txt`, `_TEMPLATES_INPUT.txt`, `_AUTO_ASSIGN_INPUT.txt`)

Статус на PROD:

- **не задеплоено** → “1.6 true” пока только в репозитории.

---

## 6. Принципы работы (обязательные)

- Один шаг за раз
- Сначала диагностика → потом код
- Архитектура важнее симптомов
- Никаких UX-правок до завершения backend-архитектуры
- Systemd — единственный допустимый способ запуска backend
- Канон = SSOT (этот файл)

---

## 7. Шаблоны команд (для быстроты)

### 7.1 Снимок дерева (локально)

```powershell
cd D:\Life-Tracker
# локально (backend app)
Get-ChildItem .\apps\api\app -Recurse -Force | Sort-Object FullName |
  ForEach-Object {
    $base = (Resolve-Path .\apps\api\app).Path + "\"
    $rel  = $_.FullName.Replace($base, "")
    if ($_.PSIsContainer) { "DIR  $rel" } else { "FILE $rel" }
  } | Out-File -Encoding UTF8 .\_TREE_LOCAL.txt
```

### 7.2 Снимок дерева (сервер)

```powershell
cd D:\Life-Tracker
ssh root@api.lifetracker.site "cd /opt/lifetracker/api && echo 'ROOT: /opt/lifetracker/api' && echo '----' && find app -print | sort" |
  Out-File -Encoding UTF8 .\_TREE_SERVER.txt
```

### 7.3 Проверка отсутствия SQL в routers/services

```powershell
cd D:\Life-Tracker\apps\api\app
Select-String -Path .\routers\*.py -Pattern "select\(|db\.execute" |
  Select-Object Path, LineNumber, Line
Select-String -Path .\services\*.py -Pattern "select\(|db\.execute" |
  Select-Object Path, LineNumber, Line
```

---

## 8. Следующий обязательный шаг после обновления канона

1. **Backend deploy** (поднять PROD до 1.6 структуры)
2. health-check
3. фиксация в каноне: “PROD обновлён до 1.6”

(Деплой выполняется отдельным шагом, после команды пользователя “далее”.)
