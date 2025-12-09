from typing import Any

import yaml
from pydantic import BaseModel, Field


class OpenAPIParameter(BaseModel):
    name: str
    in_: str = Field(alias="in")
    required: bool | None = None
    schema: dict[str, Any] | None = None


class OpenAPIEndpoint(BaseModel):
    path: str
    method: str
    summary: str | None = None
    parameters: list[OpenAPIParameter] = []
    request_body: dict[str, Any] | None = None
    responses: dict[str, Any] | None = None


def _normalize_spec(spec: Any) -> dict[str, Any]:
    if isinstance(spec, str):
        return yaml.safe_load(spec)
    if isinstance(spec, dict):
        return spec
    raise ValueError("Unsupported OpenAPI spec type")


def extract_endpoints(spec: Any) -> list[OpenAPIEndpoint]:
    data = _normalize_spec(spec)
    paths = data.get("paths", {}) or {}
    result: list[OpenAPIEndpoint] = []

    for path, methods in paths.items():
        for method, meta in methods.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete"}:
                continue
            params_meta = meta.get("parameters", []) or []
            params = [OpenAPIParameter(**p) for p in params_meta]
            endpoint = OpenAPIEndpoint(
                path=path,
                method=method.upper(),
                summary=meta.get("summary"),
                parameters=params,
                request_body=meta.get("requestBody"),
                responses=meta.get("responses"),
            )
            result.append(endpoint)
    return result
