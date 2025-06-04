"""Create frame_results table

Revision ID: 006_create_frame_results_table
Revises: 005_create_processing_jobs_table
Create Date: 2025-06-04 12:05:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "006_create_frame_results_table"
down_revision: Union[str, None] = "005_create_processing_jobs_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "frame_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("processing_job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("frame_index", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("timestamp", sa.Float(), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["processing_job_id"], ["processing_jobs.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_frame_results_processing_job_id", "frame_results", ["processing_job_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_frame_results_processing_job_id", "frame_results")
    op.drop_table("frame_results")
