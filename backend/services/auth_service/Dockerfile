FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY services/auth_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code - copy from services/auth_service to /app
COPY services/auth_service/app ./app
COPY services/auth_service/app/core ./app/core
COPY services/auth_service/app/services ./app/services

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
