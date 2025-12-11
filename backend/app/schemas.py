from typing import Any, Literal
from pydantic import BaseModel, Field

from loguru import logger

logger.add("logs/app.log", rotation="500 MB", retention="10 days")

class GenerateTestcaseRequest(BaseModel):
    test_type: Literal["ui", "api"] = Field(description="Тип тест-кейса")
    requirements_text: str | None = Field(default=None, description="Текст требований")
    openapi_spec: Any | None = Field(default=None, description="OpenAPI JSON/YAML")


class GenerateCodeResponse(BaseModel):
    code: str


class GenerateAutotestRequest(BaseModel):
    target: Literal["api", "ui"]
    openapi_spec: Any | None = None
    method: str | None = None
    path: str | None = None
    scenario: str | None = None


class ValidateTestcaseRequest(BaseModel):
    code: str


class ValidationIssue(BaseModel):
    code: str
    message: str
    line: int | None = None
    column: int | None = None
    severity: Literal["error", "warning"]


class ValidationReport(BaseModel):
    is_valid: bool
    issues: list[ValidationIssue]
    stats: dict[str, Any]
