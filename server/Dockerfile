FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system proveh \
    && useradd --system --gid proveh --home-dir /app proveh

WORKDIR /app

COPY pyproject.toml alembic.ini ./
COPY app ./app

RUN pip install --no-cache-dir .

USER proveh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl --fail http://127.0.0.1:8080/api/v1/health/live || exit 1

CMD ["sh", "-c", "alembic upgrade head && python -m app.bootstrap_admin && exec uvicorn app.main:app --host 0.0.0.0 --port 8080 --proxy-headers --forwarded-allow-ips='*'"]

