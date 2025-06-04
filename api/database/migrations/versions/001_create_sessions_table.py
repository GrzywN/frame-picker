"""Create sessions table

Revision ID: 001_create_sessions_table
Revises: None
Create Date: 2025-06-04 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_create_sessions_table"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", sa.String(255), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, default="created"),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("progress", sa.Integer(), nullable=True, default=0),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )
    op.create_index("ix_sessions_session_id", "sessions", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_sessions_session_id", "sessions")
    op.drop_table("sessions")
