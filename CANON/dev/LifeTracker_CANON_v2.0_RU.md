# LifeTracker — Канон проекта v2.0 (RU)

**Сводный документ:** архитектура репозитория, план реструктуризации, статус работ, деплой  
**Дата:** 2026-01-26

---

## 0. Контекст и смена фокуса

В ходе работы по v1.2 выяснилось, что «системный Back Telegram» на iOS в режиме **Main App / Fullscreen**
может не показываться (вместо него Telegram отображает «Закрыть»).
Поэтому в v2.0 фокус переносится с попыток «поймать стрелку Back»
на **системную устойчивость навигации** и **качественную реструктуризацию репозитория**.

- Открытая UX‑проблема (iOS: DETAIL → back/возврат → список развёрнут) **зафиксирована и припаркована**
- Основной приоритет v2.0: разнести монолитные файлы на ясные модули + закрепить инфраструктуру деплоя

---

## 1. Цели v2.0

- Сделать архитектуру репозитория читаемой: меньше монолитов, больше модулей по ответственности
- Подготовить основу для дальнейших фич (History, Templates, state‑machine навигации)
- Закрепить и формализовать деплой (frontend / backend)
- Не потерять чекпоинты v1.2: initData auth, API_BASE=/api, стабильность PROD

---

## 2. Текущее состояние (факты)

### 2.1 PROD

- Backend и frontend развернуты и работают в PROD
- Mini App настроен как Main App с режимом Fullscreen
- Авторизация через Telegram initData подтверждена
- Добавление шаблонов и появление челенджей работает

### 2.2 Что добавили / улучшили в этом чате

- Стабилизирован PowerShell‑деплой фронта
- SSH‑доступ по ключу (без пароля) для root
- Деплой без unzip (tar.gz)
- Серверный бэкап фронта перед заменой файлов (`/var/backups`)

### 2.3 Открыто

- iOS: DETAIL → back/close/возврат → today.all иногда остаётся развёрнутым
- Нужно отделить UI‑навигацию от системной
- После рефакторинга требуется уборка мусора

---

## 3. Канон деплоя (v2.0) — источник истины

### 3.1 Сервер и доступ

- Сервер: `95.163.227.121`
- SSH пользователь: `root`
- SSH ключ (ПК): `C:\Users\PC\.ssh\lifetracker`
- Frontend: `/var/www/html/app`
- Бэкапы фронта:  
  `/var/backups/lifetracker_front_app_YYYYMMDD_HHMMSS.tar.gz`

### 3.2 Деплой фронта (PowerShell)

Единый способ деплоя — запуск скрипта **с ПК**, из корня репо.

- Repo root: `D:\Life-Tracker`
- Скрипт: `deploy_frontend.ps1`
- Build: `npm run build` (apps/webapp)
- Upload: `scp` по ключу
- Deploy: `ssh → bash -s`
- Перед заменой — обязательный серверный бэкап

**Ритуал перед деплоем:**

```bash
git status
git add -A
git commit -m "..."
git push
.\deploy_frontend.ps1
```

### 3.3 Деплой backend (FastAPI)

- Канон v1.2 сохраняется
- Перед изменениями — серверный бэкап / snapshot
- В v2.0 будет введён единый backend‑deploy скрипт

---

## 4. Архитектура репозитория (цель)

### 4.1 Текущее состояние

- `apps/webapp/src/App.tsx` — монолит (навигация, TG SDK, UI, state)
- `today.ts / today_debug.ts` — логика TODAY смешана с UI
- Backend файлы рабочие, но без пакетной структуры

### 4.2 Целевая структура (frontend)

```
apps/webapp/src/
  app/
    AppShell.tsx
    bootstrap.ts
  tg/
    webapp.ts
    initData.ts
  api/
    client.ts
    today.ts
    templates.ts
  features/
    today/
      TodayScreen.tsx
      state.ts
    detail/
      DetailScreen.tsx
    templates/
      TemplatesScreen.tsx
  shared/
    ui/
    hooks/
    utils/
  domain/
```

### 4.3 Целевая структура (backend)

```
apps/backend/
  app/
    api/
    core/
    db/
    models/
    schemas/
  tests/
```

---

## 5. План реструктуризации

### Принципы

- Один шаг за раз
- Сначала диагностика, потом код
- Не деплоим ломаное, но рушим работающее ради улучшения архитектуры (чтобы после работало лучше)
- После серии изменений — обязательная уборка мусора

### Этапы

**Этап 0 — Инфраструктура (выполнено)**

- Деплой фронта + бэкапы ✅

**Этап 1 — Frontend / core**

- Вынести Telegram SDK слой (`src/tg`)
- Вынести API client (`src/api`)

**Этап 2 — Frontend / features**

- TODAY / DETAIL / TEMPLATES по фичам
- Явный state‑layer

**Этап 3 — Backend**

- Пакетизация без изменения поведения
- Smoke‑тесты

**Этап 4 — Уборка**

- Удаление debug‑кода
- Чистка неиспользуемых типов

---

## 6. Чекпоинты v1.2 (НЕ теряем)

- API_BASE = `/api`
- Все API‑запросы только при `tgOk === true`
- Авторизация через initData
- PROD тестируется только в Telegram
- nginx — только статика + proxy

---

## 7. Статус

### Выполнено

- Рабочий деплой фронта с бэкапами
- Обновление `/var/www/html/app` подтверждено

### Предстоит

- Реструктуризация frontend
- Реструктуризация backend
- Уборка мусора
- Возврат к iOS‑UX после базового плана

---

## 8. Быстрый деплой (канон)

**ПК:**

```bash
git add -A
git commit -m "..."
git push
.\deploy_frontend.ps1
```

**Сервер:**

```bash
ls -la /var/www/html/app | head
ls -la /var/www/html/app/assets | head
```
