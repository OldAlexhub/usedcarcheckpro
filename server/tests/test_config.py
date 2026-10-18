from app.config import Settings


def test_nexus_max_upload_bytes_variable_does_not_override_app_setting(
    monkeypatch,
) -> None:
    monkeypatch.setenv("MAX_UPLOAD_BYTES", r"C:\Nexus\Storage\proveh-server\local")
    monkeypatch.delenv("PROVEH_MAX_UPLOAD_BYTES", raising=False)

    settings = Settings(_env_file=None)

    assert settings.max_upload_bytes == 10 * 1024 * 1024


def test_namespaced_max_upload_bytes_can_be_configured(monkeypatch) -> None:
    monkeypatch.setenv("MAX_UPLOAD_BYTES", r"C:\Nexus\Storage\proveh-server\local")
    monkeypatch.setenv("PROVEH_MAX_UPLOAD_BYTES", "20971520")

    settings = Settings(_env_file=None)

    assert settings.max_upload_bytes == 20 * 1024 * 1024
