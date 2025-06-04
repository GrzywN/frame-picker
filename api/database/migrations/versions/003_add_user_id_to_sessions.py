"""Add user_id to sessions table

Revision ID: 003_add_user_id_to_sessions
Revises: 002_create_users_table
Create Date: 2025-06-04 12:02:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003_add_user_id_to_sessions"
down_revision: Union[str, None] = "002_create_users_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sessions", sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        "fk_sessions_user_id",
        "sessions",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_sessions_user_id", "sessions")
    op.drop_constraint("fk_sessions_user_id", "sessions", type_="foreignkey")
    op.drop_column("sessions", "user_id")
