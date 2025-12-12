FROM python:3.11-slim

WORKDIR /app

# Install LibreOffice for PDF conversion (optional)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-impress \
    && rm -rf /var/lib/apt/lists/*

# Copy renderer app
COPY apps/renderer ./apps/renderer

WORKDIR /app/apps/renderer

# Install Python dependencies
RUN pip install --no-cache-dir .

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
