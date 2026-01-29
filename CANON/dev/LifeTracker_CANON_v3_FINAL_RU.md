# LifeTracker BACKEND CANON v3.0

> **Single Source of Truth (SSOT)** для backend‑части проекта LifeTracker
>
> Статус: стабилизирован, готов к дальнейшему развитию
> Формат работы: **один шаг за раз**
> Канон фиксирует фактическое состояние backend на DEV и PROD

---

## 0. Назначение документа

Документ фиксирует:

- текущую backend‑архитектуру LifeTracker
- правила разработки и эксплуатации
- инварианты, которые **нельзя нарушать**
- схему деплоя и эксплуатации
- границу ответственности backend

Этот файл — **единственный источник истины** для backend.

---

## 1. Текущее состояние (зафиксировано)

### 1.1 Общий статус

- Backend **работоспособен и стабилен**
- Архитектура приведена к каноническому виду
- PROD переживает рестарты без деградации
- Health / Smoke / Guards подтверждены

Backend **готов принимать изменения поверх устойчивого фундамента**.

---

## 2. Технологический стек

- Python 3.x (Ubuntu 22.04)
- FastAPI
- SQLAlchemy (ORM + Core)
- SQLite (PROD и DEV)
- Uvicorn
- Nginx (reverse proxy)
- systemd (запуск и контроль)

---

## 3. Каноническая архитектура

### 3.1 Слои приложения

```
app/
├─ routers/        # HTTP слой (API)
├─ services/       # Бизнес‑логика
├─ repositories/   # Работа с БД (ЕДИНСТВЕННОЕ место SQL)
├─ core/           # Инфраструктура (logging, auth, config)
├─ db.py           # Engine / Session / get_db
├─ main.py         # Точка входа FastAPI
├─ _guards.py      # Инварианты архитектуры
├─ _smoke.py       # Smoke‑check
```

### 3.2 Инвариант слоёв

- `routers/*`
  - принимают HTTP
  - **НЕ содержат SQL**

- `services/*`
  - бизнес‑логика
  - **НЕ содержат SQL**

- `repositories/*`
  - доступ к БД
  - **ЕДИНСТВЕННОЕ место, где разрешён SQL**

Нарушение = архитектурная ошибка.

---

## 4. Работа с БД

### 4.1 База данных

- Тип: SQLite
- PROD файл: `life_tracker.db`
- Подключение через SQLAlchemy

### 4.2 Таблицы (PROD‑факт)

- `users`
- `challenges`
- `challenge_templates`
- `daily_log`

### 4.3 Инварианты БД

- Нет orphan‑записей в `daily_log`
- Нет дублей `(user_id, challenge_id, date)`
- Все проверки выполняются в read‑only режиме

---

## 5. Guards (архитектурная защита)

### Назначение

Guards — это защита канона от деградации.

### Что запрещено

- `sqlalchemy.text()` вне `repositories/*`
- raw SQL‑строки вне `repositories/*`
- SQL в `routers` и `services`

### Реализация

- Файл: `app/_guards.py`
- Запускается через smoke‑check

Если Guards падают — деплой запрещён.

---

## 6. Smoke‑check

### Назначение

Быстрая проверка целостности backend.

### Проверяет

- Guards
- DB invariants
- Импорт приложения

### Запуск

```bash
.venv/bin/python -m app._smoke
```

### Ожидаемый результат

```
GUARDS OK
DB CHECK OK
SMOKE OK
```

---

## 7. Логирование

### Принцип

- Единый logging‑конфиг
- Без `print()`
- Все логи доступны через `journalctl`

### Реализация

- Файл: `app/core/logging.py`
- Инициализация: `main.py`

### Просмотр логов

```bash
journalctl -u lifetracker-api.service
```

---

## 8. Запуск и эксплуатация (PROD)

### 8.1 Запуск backend

- **ТОЛЬКО через systemd**

```text
lifetracker-api.service
```

ExecStart:

```
/opt/lifetracker/api/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 8.2 Запрещено

- `nohup`
- `screen`
- ручной `uvicorn`
- запуск без `.venv`

---

## 9. Nginx и API

- Внешний доступ: `https://api.lifetracker.site/api/*`
- Проксирование на: `127.0.0.1:8000`

### Health

- internal: `http://127.0.0.1:8000/health`
- external: `https://api.lifetracker.site/api/health`

---

## 10. Деплой (канонический)

### Принцип

- PROD **без git**
- Деплой через архив
- Атомарная замена

### Шаги

1. Backup кода
2. Backup БД
3. Заливка архива
4. Распаковка в `app_NEW`
5. Атомарная замена
6. `compileall`
7. `systemctl restart`
8. health‑check
9. smoke‑check
10. фиксация результата

---

## 11. OPS‑check (обязателен)

Перед и после **любых** изменений:

- status systemd
- health
- smoke
- логи

Без OPS‑check шаг считается недействительным.

---

## 12. Принципы работы

- Один шаг за раз
- Диагностика → действие → фиксация
- Канон важнее скорости
- Backend — фундамент, не песочница

---

## 13. Backend Core Freeze

Файлы ядра (меняются только отдельным этапом):

- `app/_guards.py`
- `app/_smoke.py`
- `app/repositories/_db_check_repo.py`
- `app/core/logging.py`

---

**BACKEND CANON v3.0 — ЗАФИКСИРОВАН**

