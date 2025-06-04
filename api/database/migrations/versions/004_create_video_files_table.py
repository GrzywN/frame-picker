"""Create video_files table

Revision ID: 004_create_video_files_table
Revises: 003_add_user_id_to_sessions
Create Date: 2025-06-04 12:03:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004_create_video_files_table"
down_revision: Union[str, None] = "003_add_user_id_to_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "video_files",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("safe_filename", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("content_type", sa.String(100), nullable=True),
        sa.Column("duration", sa.Float(), nullable=True),
        sa.Column("fps", sa.Float(), nullable=True),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("frame_count", sa.Integer(), nullable=True),
        sa.Column("format", sa.String(50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_video_files_session_id", "video_files", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_video_files_session_id", "video_files")
    op.drop_table("video_files")
