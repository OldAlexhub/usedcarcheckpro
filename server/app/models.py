import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, LargeBinary, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


class Vault(Base):
    __tablename__ = "vaults"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    secret_hash: Mapped[bytes] = mapped_column(LargeBinary(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    app_version: Mapped[str | None] = mapped_column(String(32))

    inspections: Mapped[list["InspectionRecord"]] = relationship(
        back_populates="vault", cascade="all, delete-orphan"
    )


class InspectionRecord(Base):
    __tablename__ = "inspection_records"
    __table_args__ = (
        Index("ix_inspection_records_vault_updated", "vault_id", "server_updated_at"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vault_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vaults.id", ondelete="CASCADE"), primary_key=True
    )
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    client_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    server_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON)

    vault: Mapped[Vault] = relationship(back_populates="inspections")


class VinCache(Base):
    __tablename__ = "vin_cache"

    vin_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    decoded: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class DataInstallation(Base):
    __tablename__ = "data_installations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    secret_hash: Mapped[bytes] = mapped_column(LargeBinary(32), nullable=False)
    app_version: Mapped[str] = mapped_column(String(32), nullable=False)
    platform: Mapped[str] = mapped_column(String(16), nullable=False)
    consent_version: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    __table_args__ = (
        Index("ix_analytics_events_install_received", "install_id", "received_at"),
        Index("ix_analytics_events_name_received", "name", "received_at"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    install_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("data_installations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(48), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    app_version: Mapped[str] = mapped_column(String(32), nullable=False)
    platform: Mapped[str] = mapped_column(String(16), nullable=False)
    properties: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)


class InspectionDatasetRecord(Base):
    __tablename__ = "inspection_dataset_records"
    __table_args__ = (
        Index("ix_dataset_vehicle", "vehicle_year", "vehicle_make", "vehicle_model"),
        Index("ix_dataset_powertrain_received", "powertrain", "received_at"),
    )

    source_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    install_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("data_installations.id", ondelete="CASCADE"), nullable=False
    )
    schema_version: Mapped[int] = mapped_column(Integer, nullable=False)
    consent_version: Mapped[str] = mapped_column(String(32), nullable=False)
    app_version: Mapped[str] = mapped_column(String(32), nullable=False)
    platform: Mapped[str] = mapped_column(String(16), nullable=False)
    vehicle_year: Mapped[int] = mapped_column(Integer, nullable=False)
    vehicle_make: Mapped[str] = mapped_column(String(64), nullable=False)
    vehicle_model: Mapped[str] = mapped_column(String(64), nullable=False)
    vehicle_trim: Mapped[str | None] = mapped_column(String(64))
    powertrain: Mapped[str] = mapped_column(String(16), nullable=False)
    seller_type: Mapped[str | None] = mapped_column(String(16))
    odometer_band: Mapped[str] = mapped_column(String(32), nullable=False)
    asking_price_band: Mapped[str] = mapped_column(String(32), nullable=False)
    decision_status: Mapped[str] = mapped_column(String(32), nullable=False)
    completion_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    good_count: Mapped[int] = mapped_column(Integer, nullable=False)
    concern_count: Mapped[int] = mapped_column(Integer, nullable=False)
    critical_count: Mapped[int] = mapped_column(Integer, nullable=False)
    not_checked_count: Mapped[int] = mapped_column(Integer, nullable=False)
    not_applicable_count: Mapped[int] = mapped_column(Integer, nullable=False)
    item_results: Mapped[list[dict[str, str]]] = mapped_column(JSON, nullable=False)
    inspection_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

