# LifeTracker CANON v2.9 (RU)
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
- при необходимости — разделы PROD / Архитектура / Деплой / Observability

---

## 0.1 Журнал изменений (Changelog)

- **27.01.2026 — Этап 1.6 (Backend Core Split) завершён и задеплоен на PROD**
- **27.01.2026 — Этап 1.7 (Backend Deploy) выполнен, health-check OK**
- **27.01.2026 — Этап 1.8 (Post-deploy стабилизация) завершён**
- **27.01.2026 — Этап 1.9 (Observability, Guards, DB-invariants) полностью завершён и проверен на PROD:**
  - единое логирование задеплоено
  - добавлены Guards (SQL-инварианты)
  - smoke-check расширен (guards + db-check)
  - добавлен DB read-only check
  - проверка на PROD: `GUARDS OK / DB CHECK OK / SMOKE OK`

- **27.01.2026 — v2.9 (Runbook / Ops)**
  - добавлен обязательный OPS-check (status/health/smoke/logs) перед и после изменений
  - уточнён вход на сервер: SSH по ключу (рабочий IP + ключ), запрет bash в PowerShell
  - зафиксирована фактическая схема PROD SQLite: таблица `daily_log` (singular), `history` отсутствует


---

## 0.2 Текущее состояние (What is true now)

- Backend **в репозитории и на PROD** соответствует архитектуре  
  `routers → services → repositories → db`
- SQL разрешён **только** в `repositories/*`
- Backend на PROD:
  - запущен строго через `systemd`
  - использует **venv python** (`.venv/bin/python`, `.venv/bin/uvicorn`)
  - стабилен после рестартов
  - health-check стабильно `OK`
  - логирование унифицировано
- Smoke-check подтверждает:
  - корректный импорт приложения
  - соблюдение SQL-инвариантов
  - целостность БД
- Guards подтверждают инвариант: raw SQL и `text()` вне `repositories/*` запрещены
- DB-check подтверждает целостность PROD-БД
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

⚠️ **Важно:**

- На Ubuntu команда `python` может отсутствовать
- Всегда использовать `.venv/bin/python` или `python3`

#### Health

- internal: `http://127.0.0.1:8000/health`
- external: `https://api.lifetracker.site/api/health`
- Статус: **OK**

#### Nginx

- `https://api.lifetracker.site/api/*` → `127.0.0.1:8000/*`

---

## 2. Деплой и эксплуатация (SRE)

### 2.1 Запрещено

- Запуск backend не через `systemd`
- Использование `nohup`, `screen`, ручного `uvicorn`
- Изменения на PROD без backup
- Прямой SQL вне `repositories/*`
- UX-правки до backend-стабилизации

---

### 2.2 Backend deploy pipeline (актуальный)

Используется **archive-based deploy** (PROD без git):

1. Backup backend-кода (`tar.gz`)
2. Backup БД (`life_tracker.db`)
3. Заливка архива backend (`app/`)
4. Распаковка в `app_NEW/`
5. Атомарная замена `app → app_OLD → app`
6. `.venv/bin/python -m compileall app`
7. `systemctl restart lifetracker-api`
8. Health-check (internal + external)
9. Smoke-check (`.venv/bin/python -m app._smoke`)
10. Фиксация результата в каноне

---

### 2.3 Вход на сервер (важно)

- Основной доступ: **SSH по ключу**
- Используемый ключ: `~/.ssh/lifetracker`
- PROD сервер (backend SSH): `95.163.227.121`
- Домен API (HTTPS): `api.lifetracker.site`
- Рекомендуемый вход (Windows PowerShell):
  ```powershell
  ssh -i $env:USERPROFILE\.ssh\lifetracker root@95.163.227.121
  ```
- Рекомендуемая передача архивов деплоя (Windows PowerShell):
  ```powershell
  scp -i $env:USERPROFILE\.ssh\lifetracker .\backend_app_*.tar.gz root@95.163.227.121:/opt/lifetracker/api/
  ```

- Пример входа с Windows (PowerShell):
  ```powershell
  ssh -i $env:USERPROFILE\.ssh\lifetracker root@<SERVER_IP>
  ```
- Выполнение Linux-команд:
  - либо после ручного входа по SSH
  - либо через `ssh "bash -s"`
- **Никогда** не выполнять bash-команды напрямую в PowerShell без SSH

---

### 2.4 OPS-check (обязательный)

Цель: **одной командой** проверить состояние PROD перед/после любых изменений.

- Скрипт в репозитории: `tools/ops_check_prod.ps1`
- Проверяет:
  - `systemctl status lifetracker-api.service`
  - health internal/external
  - `/opt/lifetracker/api/.venv/bin/python -m app._smoke`
  - tail `journalctl`

Пример запуска (Windows PowerShell):
```powershell
cd D:\Life-Tracker
powershell -ExecutionPolicy Bypass -File .\tools\ops_check_prod.ps1
```

---

### 2.5 Типовые ошибки оболочек (PowerShell ↔ bash)

- `<<EOF` (heredoc) — bash-синтаксис, **в PowerShell не работает**.
- Переменная `$Host` в PowerShell зарезервирована (read-only) — не использовать как имя параметра.
- Команды `tar -czf`, `rm -rf`, `systemctl`, `date +%F...` выполнять **только на сервере** (после входа по SSH).

---

## 3. Observability, Smoke & Guards (Этап 1.9)

### 3.1 Логирование

- Подключён единый logging-конфиг:
  - файл: `app/core/logging.py`
  - инициализация в `main.py`
- Логи читаются через:
  ```bash
  journalctl -u lifetracker-api.service
  ```

---

### 3.2 Smoke-check

- Файл: `app/_smoke.py`
- Запускает:
  - Guards
  - DB-check
- Проверка:
  ```bash
  cd /opt/lifetracker/api
  .venv/bin/python -m app._smoke
  ```
- Ожидаемый результат на PROD:
  ```
  GUARDS OK
  DB CHECK OK
  SMOKE OK
  ```

---

### 3.3 Guards (SQL-инварианты)

- Файл: `app/_guards.py`
- Назначение:
  - запрет `sqlalchemy.text(...)` и `text(...)` вне `repositories/*`
  - запрет raw SQL-строк вне `repositories/*`
- Интеграция: вызываются из smoke-check

---

### 3.4 DB invariants (read-only)

- Файл: `app/repositories/_db_check_repo.py`
- Режим: **read-only** (`mode=ro`)
- PROD must-have таблицы:
  - `users`
  - `challenges`
  - `challenge_templates`
  - `daily_log`
- Проверки:
  - наличие таблиц
  - orphan-записи в `daily_log`
  - дубли `(user_id, challenge_id, date)`
- DEV режим:
  - допускается `DB CHECK SKIP` при несовпадении схемы
- PROD режим:
  - ожидается строго `DB CHECK OK`

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
- **1.9 — Observability, Guards, DB-invariants** — завершён и подтверждён на PROD

---

## 6. Принципы работы (обязательные)

- Один шаг за раз
- Диагностика → код → фиксация
- Архитектура важнее симптомов
- Канон = SSOT

---

## 7. Следующий фокус после v2.9

- регламентное наблюдение PROD (OPS-check / health / smoke / journalctl)
- freeze backend-ядра (см. раздел 8)
- подготовка новых backend-фич поверх стабильного фундамента (новые этапы v3.x)

---

## 8. Backend Core Freeze (v2.9)

Файлы ядра (изменять только отдельным этапом с обязательным OPS-check до/после):
- `app/_guards.py`
- `app/_smoke.py`
- `app/repositories/_db_check_repo.py`
- `app/core/logging.py`
