"""Create processing_jobs table

Revision ID: 005_create_processing_jobs_table
Revises: 004_create_video_files_table
Create Date: 2025-06-04 12:04:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005_create_processing_jobs_table"
down_revision: Union[str, None] = "004_create_video_files_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "processing_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("video_file_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mode", sa.String(50), nullable=False),
        sa.Column("quality", sa.String(50), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("sample_rate", sa.Integer(), nullable=False),
        sa.Column("min_interval", sa.Float(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, default="pending"),
        sa.Column("progress", sa.Integer(), nullable=True, default=0),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("estimated_time", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["video_file_id"], ["video_files.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_processing_jobs_session_id", "processing_jobs", ["session_id"])
    op.create_index(
        "ix_processing_jobs_video_file_id", "processing_jobs", ["video_file_id"]
    )
    op.create_index("ix_processing_jobs_status", "processing_jobs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_processing_jobs_status", "processing_jobs")
    op.drop_index("ix_processing_jobs_video_file_id", "processing_jobs")
    op.drop_index("ix_processing_jobs_session_id", "processing_jobs")
    op.drop_table("processing_jobs")
