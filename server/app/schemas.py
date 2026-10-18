import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class HealthResponse(BaseModel):
    status: Literal["ok", "unavailable"]
    service: str = "proveh-server"


class VinDecodeRequest(BaseModel):
    vin: str = Field(min_length=17, max_length=17)

    @field_validator("vin")
    @classmethod
    def normalize_vin(cls, value: str) -> str:
        return value.strip().upper()


class VinDecodeResponse(BaseModel):
    valid: bool
    cached: bool
    year: str | None = None
    make: str | None = None
    model: str | None = None
    trim: str | None = None
    vehicle_type: str | None = None
    body_class: str | None = None
    fuel_type: str | None = None
    electrification_level: str | None = None
    engine_cylinders: str | None = None
    displacement_liters: str | None = None
    error_code: str | None = None
    error_text: str | None = None


class VaultCreateRequest(BaseModel):
    app_version: str | None = Field(default=None, max_length=32)


class VaultCreateResponse(BaseModel):
    vault_id: uuid.UUID
    secret: str
    warning: str = "Store this secret securely. The server cannot recover it."


class InspectionUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    client_updated_at: datetime
    payload: dict[str, Any]


class SyncRequest(BaseModel):
    since: datetime | None = None
    upserts: list[InspectionUpsert] = Field(default_factory=list, max_length=100)
    deletions: list[str] = Field(default_factory=list, max_length=100)


class SyncInspection(BaseModel):
    id: str
    revision: int
    client_updated_at: datetime
    server_updated_at: datetime
    deleted: bool
    payload: dict[str, Any] | None


class SyncResponse(BaseModel):
    cursor: datetime
    inspections: list[SyncInspection]


class ImageQualityResponse(BaseModel):
    width: int
    height: int
    blur_score: float
    brightness: float
    glare_percent: float
    dark_percent: float
    quality_score: int
    acceptable: bool
    warnings: list[str]


AnalyticsValue = bool | int | float | str


class AnalyticsEventIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=8, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    name: Literal[
        "app_opened",
        "onboarding_completed",
        "vin_lookup_completed",
        "inspection_started",
        "inspection_completed",
        "report_exported",
        "comparison_created",
    ]
    occurred_at: datetime
    properties: dict[str, AnalyticsValue] = Field(default_factory=dict)


class AnalyticsBatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    app_version: str = Field(min_length=1, max_length=32)
    platform: Literal["android", "ios"]
    consent_version: str = Field(min_length=1, max_length=32)
    events: list[AnalyticsEventIn] = Field(min_length=1, max_length=50)


class AnalyticsBatchResponse(BaseModel):
    accepted: int


class DataInstallationCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    app_version: str = Field(min_length=1, max_length=32)
    platform: Literal["android", "ios"]
    consent_version: str = Field(min_length=1, max_length=32)


class DataInstallationCreateResponse(BaseModel):
    install_id: str
    secret: str
    warning: str = "Store this secret securely. It is required to delete collected data."


class DatasetItemResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    item_id: str = Field(min_length=1, max_length=80, pattern=r"^[A-Za-z0-9_-]+$")
    status: Literal[
        "good", "concern", "critical", "not_checked", "not_applicable"
    ]


class InspectionDatasetUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_id: str = Field(min_length=8, max_length=64, pattern=r"^[A-Za-z0-9_-]+$")
    inspection_updated_at: datetime
    vehicle_year: int = Field(ge=1886, le=2100)
    vehicle_make: str = Field(min_length=1, max_length=64)
    vehicle_model: str = Field(min_length=1, max_length=64)
    vehicle_trim: str | None = Field(default=None, max_length=64)
    powertrain: Literal["gasoline", "diesel", "hybrid", "electric"]
    seller_type: Literal["private", "dealer", "other"] | None = None
    odometer_band: Literal[
        "unknown",
        "0-24,999",
        "25,000-49,999",
        "50,000-74,999",
        "75,000-99,999",
        "100,000-149,999",
        "150,000-199,999",
        "200,000+",
    ]
    asking_price_band: Literal[
        "unknown",
        "0-4,999",
        "5,000-9,999",
        "10,000-14,999",
        "15,000-24,999",
        "25,000-39,999",
        "40,000+",
    ]
    decision_status: Literal[
        "still_reviewing",
        "ask_mechanic",
        "request_info",
        "considering",
        "pass",
        "purchased",
    ]
    item_results: list[DatasetItemResult] = Field(min_length=1, max_length=300)

    @field_validator("vehicle_make", "vehicle_model")
    @classmethod
    def normalize_required_vehicle_text(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("vehicle value must not be blank")
        return normalized

    @field_validator("vehicle_trim")
    @classmethod
    def normalize_optional_vehicle_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return " ".join(value.split()) or None

    @model_validator(mode="after")
    def reject_duplicate_items(self) -> "InspectionDatasetUpsert":
        item_ids = [item.item_id for item in self.item_results]
        if len(item_ids) != len(set(item_ids)):
            raise ValueError("item_results contains duplicate item IDs")
        return self


class InspectionDatasetBatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: Literal[1]
    app_version: str = Field(min_length=1, max_length=32)
    platform: Literal["android", "ios"]
    consent_version: str = Field(min_length=1, max_length=32)
    records: list[InspectionDatasetUpsert] = Field(min_length=1, max_length=25)


class InspectionDatasetBatchResponse(BaseModel):
    upserted: int

