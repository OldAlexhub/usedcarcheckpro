"""Initial Proveh schema.

Revision ID: 0001_initial
Revises:
"""

import sqlalchemy as sa
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "admin_users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_admin_users_username", "admin_users", ["username"], unique=True)
    op.create_table(
        "vaults",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("secret_hash", sa.LargeBinary(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("app_version", sa.String(length=32), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "vin_cache",
        sa.Column("vin_hash", sa.String(length=64), nullable=False),
        sa.Column("decoded", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("vin_hash"),
    )
    op.create_index("ix_vin_cache_expires_at", "vin_cache", ["expires_at"])
    op.create_table(
        "data_installations",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("secret_hash", sa.LargeBinary(length=32), nullable=False),
        sa.Column("app_version", sa.String(length=32), nullable=False),
        sa.Column("platform", sa.String(length=16), nullable=False),
        sa.Column("consent_version", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("install_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=48), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("app_version", sa.String(length=32), nullable=False),
        sa.Column("platform", sa.String(length=16), nullable=False),
        sa.Column("properties", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(
            ["install_id"], ["data_installations.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_analytics_events_install_received",
        "analytics_events",
        ["install_id", "received_at"],
    )
    op.create_index(
        "ix_analytics_events_name_received",
        "analytics_events",
        ["name", "received_at"],
    )
    op.create_table(
        "inspection_dataset_records",
        sa.Column("source_key", sa.String(length=64), nullable=False),
        sa.Column("install_id", sa.String(length=64), nullable=False),
        sa.Column("schema_version", sa.Integer(), nullable=False),
        sa.Column("consent_version", sa.String(length=32), nullable=False),
        sa.Column("app_version", sa.String(length=32), nullable=False),
        sa.Column("platform", sa.String(length=16), nullable=False),
        sa.Column("vehicle_year", sa.Integer(), nullable=False),
        sa.Column("vehicle_make", sa.String(length=64), nullable=False),
        sa.Column("vehicle_model", sa.String(length=64), nullable=False),
        sa.Column("vehicle_trim", sa.String(length=64), nullable=True),
        sa.Column("powertrain", sa.String(length=16), nullable=False),
        sa.Column("seller_type", sa.String(length=16), nullable=True),
        sa.Column("odometer_band", sa.String(length=32), nullable=False),
        sa.Column("asking_price_band", sa.String(length=32), nullable=False),
        sa.Column("decision_status", sa.String(length=32), nullable=False),
        sa.Column("completion_percent", sa.Integer(), nullable=False),
        sa.Column("good_count", sa.Integer(), nullable=False),
        sa.Column("concern_count", sa.Integer(), nullable=False),
        sa.Column("critical_count", sa.Integer(), nullable=False),
        sa.Column("not_checked_count", sa.Integer(), nullable=False),
        sa.Column("not_applicable_count", sa.Integer(), nullable=False),
        sa.Column("item_results", sa.JSON(), nullable=False),
        sa.Column("inspection_updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["install_id"], ["data_installations.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("source_key"),
    )
    op.create_index(
        "ix_dataset_vehicle",
        "inspection_dataset_records",
        ["vehicle_year", "vehicle_make", "vehicle_model"],
    )
    op.create_index(
        "ix_dataset_powertrain_received",
        "inspection_dataset_records",
        ["powertrain", "received_at"],
    )
    op.create_table(
        "inspection_records",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("vault_id", sa.Uuid(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("client_updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("server_updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["vault_id"], ["vaults.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", "vault_id"),
    )
    op.create_index(
        "ix_inspection_records_vault_updated",
        "inspection_records",
        ["vault_id", "server_updated_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_inspection_records_vault_updated", table_name="inspection_records")
    op.drop_table("inspection_records")
    op.drop_index(
        "ix_dataset_powertrain_received", table_name="inspection_dataset_records"
    )
    op.drop_index("ix_dataset_vehicle", table_name="inspection_dataset_records")
    op.drop_table("inspection_dataset_records")
    op.drop_index("ix_analytics_events_name_received", table_name="analytics_events")
    op.drop_index("ix_analytics_events_install_received", table_name="analytics_events")
    op.drop_table("analytics_events")
    op.drop_table("data_installations")
    op.drop_index("ix_vin_cache_expires_at", table_name="vin_cache")
    op.drop_table("vin_cache")
    op.drop_table("vaults")
    op.drop_index("ix_admin_users_username", table_name="admin_users")
    op.drop_table("admin_users")

