# 1) Стадия сборки
FROM python:3.11-slim as builder
WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Копируем и устанавливаем зависимости В текущий проект
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# 2) Финальная стадия
FROM python:3.11-slim
WORKDIR /app

# Устанавливаем curl для healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Создаём логи и данные
RUN mkdir -p logs data && chmod 775 logs data

# Создаём непривилегированного пользователя
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Меняем владельца директорий
RUN chown -R appuser:appuser logs data

# Копируем зависимости ИЗ стадии builder в системные пути Python
COPY --from=builder /install /usr/local

# Копируем исходный код проекта
COPY --chown=appuser:appuser . .

# Переключаемся на непривилегированного пользователя
USER appuser

# Открываем порт
EXPOSE 8000

# Команда запуска
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]