from fastapi import FastAPI, HTTPException

from autotest_generator import generate_api_autotest, generate_ui_autotest
from config import get_settings
from schemas import (
    GenerateAutotestRequest,
    GenerateCodeResponse,
    GenerateTestcaseRequest,
    ValidateTestcaseRequest,
    ValidationReport,
)
from testcase_generator import generate_testcase
from validator import validate_testcase

settings = get_settings()
app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate/testcase", response_model=GenerateCodeResponse)
async def generate_testcase_endpoint(payload: GenerateTestcaseRequest) -> GenerateCodeResponse:
    try:
        code = await generate_testcase(
            test_type=payload.test_type,
            requirements_text=payload.requirements_text,
            openapi_spec=payload.openapi_spec,
        )
        return GenerateCodeResponse(code=code)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/generate/autotest", response_model=GenerateCodeResponse)
async def generate_autotest_endpoint(payload: GenerateAutotestRequest) -> GenerateCodeResponse:
    try:
        if payload.target == "api":
            if not (payload.openapi_spec and payload.method and payload.path):
                raise ValueError("Для target=api нужны openapi_spec, method и path")
            code = await generate_api_autotest(
                openapi_spec=payload.openapi_spec,
                method=payload.method,
                path=payload.path,
            )
        else:
            if not payload.scenario:
                raise ValueError("Для target=ui нужен scenario")
            code = await generate_ui_autotest(payload.scenario)
        return GenerateCodeResponse(code=code)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/validate/testcase", response_model=ValidationReport)
async def validate_testcase_endpoint(payload: ValidateTestcaseRequest) -> ValidationReport:
    return validate_testcase(payload.code)
