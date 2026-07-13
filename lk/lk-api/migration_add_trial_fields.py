"""
Alembic-миграция: добавление полей триала в таблицу users
─────────────────────────────────────────────────────────
Сохраните в:  alembic/versions/XXXX_add_trial_fields.py
Поменяйте revision/down_revision на актуальные значения.

Поля:
  trial_ends_at      — дата окончания пробного периода (now + 3 дня при регистрации)
  trial_plays_used   — сколько сказок прослушано в триале (лимит: 1)
  trial_voices_used  — сколько голосов сгенерировано в триале (лимит: 1)
"""

revision = "0002_add_trial_fields"
down_revision = "0001"          # ← укажите реальный предыдущий revision
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "trial_ends_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="UTC-время окончания пробного периода",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "trial_plays_used",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="Прослушиваний сказок в триале (лимит 5)",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "trial_voices_used",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="Голосов сгенерировано в триале (лимит 1)",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "trial_voices_used")
    op.drop_column("users", "trial_plays_used")
    op.drop_column("users", "trial_ends_at")


# ─── SQLAlchemy-модель (добавьте эти поля в класс User) ──────────────────────
#
# class User(Base):
#     __tablename__ = "users"
#     # ... существующие поля ...
#
#     trial_ends_at = Column(
#         DateTime(timezone=True),
#         nullable=True,
#         comment="UTC окончания триала",
#     )
#     trial_plays_used = Column(
#         Integer, nullable=False, default=0, server_default="0",
#         comment="Прослушиваний сказок в триале",
#     )
#     trial_voices_used = Column(
#         Integer, nullable=False, default=0, server_default="0",
#         comment="Голосов сгенерировано в триале",
#     )


# ─── /auth/register — добавить при создании пользователя ─────────────────────
#
# from datetime import datetime, timezone, timedelta
#
# new_user = User(
#     username=body.username,
#     email=body.email.lower(),
#     password_hash=hash_password(body.password),
#     trial_ends_at=datetime.now(timezone.utc) + timedelta(days=3),  # ← добавить
#     trial_plays_used=0,                                              # ← добавить
#     trial_voices_used=0,                                             # ← добавить
# )


# ─── SQL напрямую (альтернатива Alembic) ─────────────────────────────────────
#
# ALTER TABLE users
#   ADD COLUMN trial_ends_at      TIMESTAMPTZ,
#   ADD COLUMN trial_plays_used   INTEGER NOT NULL DEFAULT 0,
#   ADD COLUMN trial_voices_used  INTEGER NOT NULL DEFAULT 0;
