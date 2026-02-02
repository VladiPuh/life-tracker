from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from .db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=False, index=True)
    username = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    timezone = Column(String, nullable=False, default="Europe/Vilnius")
    last_closed_date = Column(Date, nullable=True)

class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    # Тип челленджа: DO | NO_DO
    type = Column(String, nullable=False, default="DO")

    # Политика автопроставления при "не отмечено"
    # FAIL | MIN   (BONUS/SKIP запрещены как политика)
    miss_policy = Column(String, nullable=False, default="FAIL")

    is_active = Column(Boolean, nullable=False, default=True)
    is_template = Column(Boolean, nullable=False, default=False)

    # Поля из твоего Excel (все nullable — MVP)
    goal = Column(Text, nullable=True)
    checkpoints = Column(Text, nullable=True)
    min_activity_text = Column(Text, nullable=True)
    min_minutes = Column(Integer, nullable=True)
    bonus_text = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    success_metrics = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class DailyLog(Base):
    __tablename__ = "daily_log"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False, index=True)

    date = Column(Date, nullable=False, index=True)
    # Происхождение факта: MANUAL | AUTO
    origin = Column(String, nullable=False, default="MANUAL")

    flag_min = Column(Boolean, nullable=False, default=False)
    flag_bonus = Column(Boolean, nullable=False, default=False)
    flag_skip = Column(Boolean, nullable=False, default=False)
    flag_fail = Column(Boolean, nullable=False, default=False)

    minutes_fact = Column(Integer, nullable=True)
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    edited_at = Column(DateTime)
    edited_origin = Column(String)

class ChallengeTemplate(Base):
    __tablename__ = "challenge_templates"
    id = Column(Integer, primary_key=True)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Политика автопроставления при "не отмечено"
    # FAIL | MIN
    miss_policy = Column(String, nullable=False, default="FAIL")

    # Поля из твоего Excel (все nullable — MVP)
    goal = Column(Text, nullable=True)
    checkpoints = Column(Text, nullable=True)
    min_activity_text = Column(Text, nullable=True)
    min_minutes = Column(Integer, nullable=True)
    bonus_text = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    success_metrics = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

