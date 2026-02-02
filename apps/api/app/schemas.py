from pydantic import BaseModel, model_validator
from datetime import date
from typing import Optional, Literal

MissPolicy = Literal["FAIL", "MIN"]

class ChallengeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    miss_policy: MissPolicy = "FAIL"

class ChallengePatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    miss_policy: Optional[MissPolicy] = None
    is_active: Optional[bool] = None

class DailyFlagSet(BaseModel):
    challenge_id: int
    date: Optional[date] = None  # если пусто — today на сервере
    flag: Literal["MIN", "BONUS", "SKIP", "FAIL"]
    minutes_fact: Optional[int] = None
    comment: Optional[str] = None

    @model_validator(mode="after")
    def _require_comment_for_fail_skip(self):
        if self.flag in ("FAIL", "SKIP"):
            if self.comment is None or self.comment.strip() == "":
                raise ValueError("comment is required for FAIL/SKIP")
        return self

class TodayItem(BaseModel):
    challenge_id: int
    title: str
    status_view: Optional[Literal["MIN", "BONUS", "SKIP", "FAIL"]] = None

class TemplateOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    miss_policy: MissPolicy

class TemplateAddResult(BaseModel):
    challenge_id: int

