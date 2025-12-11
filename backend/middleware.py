"""
Middleware для FastAPI приложения
"""
import time
import json
from typing import Callable, Dict, Any
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from loguru import logger


async def log_requests(request: Request, call_next) -> Response:
    """
    Middleware для логирования всех запросов
    """
    start_time = time.time()
    
    # Логируем входящий запрос
    request_id = request.headers.get("X-Request-ID", "unknown")
    client_ip = request.client.host if request.client else "unknown"
    
    logger.info(
        f"← [{request_id}] {request.method} {request.url.path} "
        f"from {client_ip}"
    )
    
    # Обрабатываем запрос
    try:
        response = await call_next(request)
    except Exception as exc:
        # Логируем необработанные исключения
        process_time = time.time() - start_time
        logger.error(
            f"✗ [{request_id}] {request.method} {request.url.path} "
            f"failed in {process_time:.3f}s: {exc}"
        )
        raise
    
    # Логируем результат
    process_time = time.time() - start_time
    logger.info(
        f"→ [{request_id}] {request.method} {request.url.path} "
        f"{response.status_code} in {process_time:.3f}s"
    )
    
    # Добавляем метаданные в заголовки
    response.headers["X-Process-Time"] = f"{process_time:.3f}"
    response.headers["X-Request-ID"] = request_id
    
    return response


def exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Глобальный обработчик исключений
    """
    request_id = request.headers.get("X-Request-ID", "unknown")
    
    # Определяем статус код на основе типа исключения
    if isinstance(exc, ValueError):
        status_code = 400
    elif isinstance(exc, KeyError):
        status_code = 400
    elif isinstance(exc, AttributeError):
        status_code = 400
    else:
        status_code = 500
    
    # Логируем ошибку
    logger.error(
        f"⚠ [{request_id}] Exception in {request.method} {request.url.path}: "
        f"{type(exc).__name__}: {exc}"
    )
    
    # Формируем ответ
    error_detail = {
        "error": type(exc).__name__,
        "message": str(exc),
        "request_id": request_id,
        "path": request.url.path,
        "method": request.method,
    }
    
    # В production можно скрывать детали 500 ошибок
    if status_code >= 500:
        error_detail["message"] = "Internal server error"
        error_detail["detail"] = "Contact support with request_id"
    
    return JSONResponse(
        status_code=status_code,
        content=error_detail,
        headers={"X-Request-ID": request_id}
    )