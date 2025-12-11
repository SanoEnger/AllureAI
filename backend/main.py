from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from autotest_generator import generate_api_autotest, generate_ui_autotest
from config import get_settings
from middleware import log_requests, exception_handler
from metrics import metrics_collector
from schemas import (
    GenerateAutotestRequest,
    GenerateCodeResponse,
    GenerateTestcaseRequest,
    ValidateTestcaseRequest,
    ValidationReport,
)
from testcase_generator import generate_testcase
from validator import validate_testcase

from loguru import logger

logger.add("logs/app.log", rotation="500 MB", retention="10 days")

settings = get_settings()
app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

# Middleware
app.middleware("http")(log_requests)
app.add_exception_handler(Exception, exception_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В production заменить на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint"""
    return {"status": "ok", "service": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/metrics")
async def get_metrics() -> dict:
    """Метрики AI-агента"""
    try:
        from llm_client import llm_client
        metrics = metrics_collector.collect_metrics(llm_client)
        return metrics.to_dict()
    except Exception as e:
        logger.error(f"Ошибка при сборе метрик: {e}")
        return {"error": "Failed to collect metrics"}


@app.get("/metrics/prometheus")
async def get_metrics_prometheus() -> str:
    """Метрики в формате Prometheus"""
    try:
        from llm_client import llm_client
        metrics_collector.collect_metrics(llm_client)
        return metrics_collector.export_metrics_prometheus()
    except Exception as e:
        logger.error(f"Ошибка при экспорте метрик Prometheus: {e}")
        return "# Error collecting metrics\n"


@app.get("/metrics/summary")
async def get_metrics_summary(hours: int = 24) -> dict:
    """Сводная статистика метрик"""
    try:
        return metrics_collector.get_summary_stats(hours)
    except Exception as e:
        logger.error(f"Ошибка при получении сводки метрик: {e}")
        return {"error": "Failed to get metrics summary"}


@app.post("/generate/testcase", response_model=GenerateCodeResponse)
async def generate_testcase_endpoint(payload: GenerateTestcaseRequest) -> GenerateCodeResponse:
    """Генерация тест-кейса"""
    try:
        metrics_collector.record_request("testcase_generation", True, 0, 0)
        
        code = await generate_testcase(
            test_type=payload.test_type,
            requirements_text=payload.requirements_text,
            openapi_spec=payload.openapi_spec,
        )
        return GenerateCodeResponse(code=code)
    except Exception as exc:
        metrics_collector.record_request("testcase_generation", False, 0, 0)
        logger.error(f"Ошибка генерации тест-кейса: {exc}")
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/generate/autotest", response_model=GenerateCodeResponse)
async def generate_autotest_endpoint(payload: GenerateAutotestRequest) -> GenerateCodeResponse:
    """Генерация автотеста"""
    try:
        if payload.target == "api":
            metrics_collector.record_request("autotest_api", True, 0, 0)
            
            if not (payload.openapi_spec and payload.method and payload.path):
                raise ValueError("Для target=api нужны openapi_spec, method и path")
            code = await generate_api_autotest(
                openapi_spec=payload.openapi_spec,
                method=payload.method,
                path=payload.path,
            )
        else:
            metrics_collector.record_request("autotest_ui", True, 0, 0)
            
            if not payload.scenario:
                raise ValueError("Для target=ui нужен scenario")
            code = await generate_ui_autotest(payload.scenario)
        return GenerateCodeResponse(code=code)
    except Exception as exc:
        metrics_collector.record_request(f"autotest_{payload.target}", False, 0, 0)
        logger.error(f"Ошибка генерации автотеста: {exc}")
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/validate/testcase", response_model=ValidationReport)
async def validate_testcase_endpoint(payload: ValidateTestcaseRequest) -> ValidationReport:
    """Валидация тест-кейса"""
    metrics_collector.record_request("validation", True, 0, 0)
    return validate_testcase(payload.code)


@app.get("/")
async def root():
    """Корневой endpoint"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "endpoints": {
            "generate_testcase": "/generate/testcase",
            "generate_autotest": "/generate/autotest",
            "validate_testcase": "/validate/testcase",
            "metrics": "/metrics",
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc",
        }
    }


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Запуск {settings.APP_NAME} v{settings.APP_VERSION}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )