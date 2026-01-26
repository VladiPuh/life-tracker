# apps/api/app/services/status.py

from __future__ import annotations

def compute_status_view(log) -> str:
    """
    UI/status view derived from DailyLog flags.
    KEEP BEHAVIOR IDENTICAL to the previous main.py implementation.
    """
    if log is None:
        return "WAITING"
    if getattr(log, "fail", False):
        return "FAIL"
    if getattr(log, "skip", False):
        return "SKIP"
    if getattr(log, "bonus", False):
        return "BONUS"
    if getattr(log, "min", False):
        return "MIN"
    return "WAITING"


def apply_single_flag(log, flag: str) -> None:
    """
    Set exactly one flag True on a DailyLog and reset others to False.
    KEEP BEHAVIOR IDENTICAL to the previous main.py implementation.
    """
    log.min = (flag == "MIN")
    log.bonus = (flag == "BONUS")
    log.skip = (flag == "SKIP")
    log.fail = (flag == "FAIL")
