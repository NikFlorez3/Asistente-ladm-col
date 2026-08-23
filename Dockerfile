# Dockerfile optimizado para despliegue en Hugging Face Spaces, Render, Railway o Google Cloud
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente y la base vectorial existente
COPY . .

# Puerto por defecto (7860 para Hugging Face Spaces, configurable vía variable de entorno PORT)
ENV PORT=7860
EXPOSE 7860

# Iniciar servidor con Gunicorn
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT:-7860} --workers 1 --threads 4 --timeout 120"]
