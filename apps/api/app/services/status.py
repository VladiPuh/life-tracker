# apps/api/app/services/status.py

from __future__ import annotations

def compute_status_view(log):
    if log is None:
        return None
    if log.flag_fail:
        return "FAIL"
    if log.flag_skip:
        return "SKIP"
    if log.flag_bonus:
        return "BONUS"
    if log.flag_min:
        return "MIN"
    return None

def apply_single_flag(log, flag: str):
    log.flag_min = False
    log.flag_bonus = False
    log.flag_skip = False
    log.flag_fail = False

    if flag == "MIN":
        log.flag_min = True
    elif flag == "BONUS":
        log.flag_bonus = True
    elif flag == "SKIP":
        log.flag_skip = True
    elif flag == "FAIL":
        log.flag_fail = True
