from pydantic import BaseModel, Field
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

