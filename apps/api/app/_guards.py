import re
import sys
from pathlib import Path


# Guards v4:
# - SQL разрешён только в repositories/*
# - вне repositories запрещаем:
#   1) sqlalchemy.text / from sqlalchemy import text / text(...)
#   2) raw SQL ТОЛЬКО в строках и только по сильным паттернам:
#      SELECT ... FROM, INSERT INTO, UPDATE ... SET, DELETE FROM,
#      CREATE TABLE, DROP TABLE, ALTER TABLE
# - игнорируем сам файл _guards.py


SQL_STRING_PATTERNS = [
    re.compile(r"\bSELECT\b[\s\S]{0,300}\bFROM\b", re.IGNORECASE),
    re.compile(r"\bINSERT\b[\s\S]{0,80}\bINTO\b", re.IGNORECASE),
    re.compile(r"\bUPDATE\b[\s\S]{0,200}\bSET\b", re.IGNORECASE),
    re.compile(r"\bDELETE\b[\s\S]{0,80}\bFROM\b", re.IGNORECASE),
    re.compile(r"\bCREATE\b[\s\S]{0,80}\bTABLE\b", re.IGNORECASE),
    re.compile(r"\bDROP\b[\s\S]{0,80}\bTABLE\b", re.IGNORECASE),
    re.compile(r"\bALTER\b[\s\S]{0,80}\bTABLE\b", re.IGNORECASE),
]

# простое извлечение строковых литералов (одинарные/двойные/тройные кавычки)
STRING_LITERALS_RE = re.compile(
    r"""(?P<q>'''|\"\"\"|'|")(?P<body>.*?)(?P=q)""",
    re.DOTALL,
)

SQLA_TEXT_IMPORT_RE = re.compile(r"^\s*from\s+sqlalchemy\s+import\s+text\s*$", re.IGNORECASE | re.MULTILINE)
SQLA_TEXT_ATTR_RE = re.compile(r"sqlalchemy\.text\s*\(", re.IGNORECASE)
TEXT_CALL_RE = re.compile(r"(^|\W)text\s*\(", re.IGNORECASE)


def _iter_py_files(app_dir: Path):
    for p in app_dir.rglob("*.py"):
        if "__pycache__" in p.parts:
            continue
        if p.name == "_guards.py":
            continue
        yield p


def _is_inside_repositories(p: Path) -> bool:
    return "repositories" in p.parts


def _line_of_pos(src: str, pos: int) -> int:
    return src.count("\n", 0, pos) + 1


def run() -> None:
    app_dir = Path(__file__).resolve().parent
    violations = []

    for py in _iter_py_files(app_dir):
        if _is_inside_repositories(py):
            continue

        src = py.read_text(encoding="utf-8", errors="replace")

        # 1) запрет text() вне repositories
        if SQLA_TEXT_IMPORT_RE.search(src):
            violations.append((str(py.relative_to(app_dir)), 1, "import text (sqlalchemy)", "from sqlalchemy import text"))
        if SQLA_TEXT_ATTR_RE.search(src):
            violations.append((str(py.relative_to(app_dir)), 1, "sqlalchemy.text(...)", "sqlalchemy.text("))
        if TEXT_CALL_RE.search(src):
            violations.append((str(py.relative_to(app_dir)), 1, "text(...)", "text("))

        # 2) raw SQL только внутри строк
        for m in STRING_LITERALS_RE.finditer(src):
            body = m.group("body")
            for rx in SQL_STRING_PATTERNS:
                mm = rx.search(body)
                if mm:
                    # позиция строки в исходнике (примерно: от начала строки-литерала)
                    lineno = _line_of_pos(src, m.start())
                    line = src.splitlines()[lineno - 1].strip() if src.splitlines() else ""
                    violations.append((str(py.relative_to(app_dir)), lineno, "raw SQL in string", line))
                    break

    if violations:
        print("GUARDS FAIL")
        for rel, lineno, name, line in violations:
            print(f"- {rel}:{lineno} | {name} | {line}")
        sys.exit(1)

    print("GUARDS OK")


if __name__ == "__main__":
    run()
