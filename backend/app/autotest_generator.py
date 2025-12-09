import re
from typing import Any

from llm_client import llm_client
from openapi_parser import extract_endpoints


def _extract_python_code(text: str) -> str:
    code = re.sub(r"``````", "")
    return code.strip()


async def generate_api_autotest(openapi_spec: Any, method: str, path: str) -> str:
    endpoints = extract_endpoints(openapi_spec)
    endpoint = next(
        (e for e in endpoints if e.method.upper() == method.upper() and e.path == path),
        None,
    )
    if not endpoint:
        raise ValueError("Endpoint not found in OpenAPI spec")

    prompt = f"""
На основе OpenAPI-спецификации:

{openapi_spec}

Сгенерируй pytest-тест для эндпоинта {method.upper()} {path}.
Используй библиотеку httpx.
Добавь аутентификацию через Bearer-токен.
Включи проверки статус-кода и структуры ответа.
"""

    raw = await llm_client.generate(prompt)
    code = _extract_python_code(raw)
    if "import httpx" not in code:
        code = "import httpx\n\n" + code
    return code


async def generate_ui_autotest(scenario: str) -> str:
    prompt = f"""
Сгенерируй UI-тест на Playwright для сценария:

{scenario}

Используй:
- page.goto()
- page.click()
- page.fill()
- expect().toBeVisible()

Добавь Allure-степы.
"""

    raw = await llm_client.generate(prompt)
    code = _extract_python_code(raw)
    if "import allure" not in code:
        code = "import allure\n" + code
    return code
