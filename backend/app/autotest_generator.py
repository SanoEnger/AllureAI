import re
from typing import Any

from llm_client import llm_client
from openapi_parser import extract_endpoints
from prompt_templates import (
    PromptTemplates, 
    TestPriority, 
    get_api_autotest_prompt,
    get_ui_autotest_prompt
)
from loguru import logger

logger.add("logs/app.log", rotation="500 MB", retention="10 days")


def _extract_python_code(text: str) -> str:
    """Извлекает Python код из markdown блоков или текста ответа LLM"""
    pattern = r"```(?:python)?\n?(.*?)```"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    if matches:
        return matches[0].strip()
    return text.strip()


async def generate_api_autotest(openapi_spec: Any, method: str, path: str) -> str:
    """
    Генерирует API автотест через Cloud.ru GigaChat
    """
    endpoints = extract_endpoints(openapi_spec)
    endpoint = next(
        (e for e in endpoints if e.method.upper() == method.upper() and e.path == path),
        None,
    )
    if not endpoint:
        raise ValueError("Endpoint not found in OpenAPI spec")
    
    logger.info(f"Генерация API автотеста для {method} {path} через Cloud.ru GigaChat")
    
    # Подготавливаем информацию об эндпоинте
    endpoint_info = {
        "method": method.upper(),
        "path": path,
        "summary": endpoint.summary or "",
        "parameters": len(endpoint.parameters),
        "has_request_body": endpoint.request_body is not None
    }
    
    try:
        # Используем промпт-шаблон для API тестов
        prompt, params = get_api_autotest_prompt(
            openapi_spec=str(openapi_spec)[:5000],  # Ограничиваем длину
            endpoint_info=endpoint_info,
            priority=TestPriority.CRITICAL
        )
        
        logger.debug(f"Отправка промпта для API автотеста, длина: {len(prompt)} символов")
        
        # Генерация через Cloud.ru GigaChat
        raw = await llm_client.generate(
            prompt=prompt,
            system_prompt=params.get("system_role"),
            use_cache=True,
            validate=True
        )
        
        code = _extract_python_code(raw)
        
        # Добавляем необходимые импорты если их нет
        if "import httpx" not in code and "AsyncClient" in code:
            code = "import httpx\n" + code
        if "import allure" not in code:
            code = "import allure\n" + code
        
        return code
        
    except Exception as e:
        logger.error(f"Ошибка при генерации API автотеста через Cloud.ru GigaChat: {e}")
        # Fallback
        return (
            "import allure\n"
            "import httpx\n"
            "import pytest\n\n"
            f"class TestAPI_{method}_{path.replace('/', '_').strip('_')}:\n"
            f"    \"\"\"Fallback API тест для {method} {path}\"\"\"\n\n"
            f"    @allure.feature('API Testing')\n"
            f"    @allure.story('{path}')\n"
            f"    @allure.title('{method} {path} - Fallback test')\n"
            f"    @allure.tag('CRITICAL')\n"
            f"    def test_fallback(self):\n"
            f"        \"\"\"Fallback тест при ошибке генерации\"\"\"\n"
            f"        assert True\n"
        )


async def generate_ui_autotest(scenario: str) -> str:
    """
    Генерирует UI автотест через Cloud.ru GigaChat
    """
    logger.info(f"Генерация UI автотеста через Cloud.ru GigaChat")
    
    try:
        # Используем промпт-шаблон для UI тестов
        prompt, params = get_ui_autotest_prompt(
            scenario=scenario,
            priority=TestPriority.NORMAL,
            framework="playwright"
        )
        
        logger.debug(f"Отправка промпта для UI автотеста, длина: {len(prompt)} символов")
        
        # Генерация через Cloud.ru GigaChat
        raw = await llm_client.generate(
            prompt=prompt,
            system_prompt=params.get("system_role"),
            use_cache=True,
            validate=True
        )
        
        code = _extract_python_code(raw)
        
        # Добавляем необходимые импорты если их нет
        if "import allure" not in code:
            code = "import allure\n" + code
        if "from playwright" not in code and "page.goto" in code:
            code = "from playwright.sync_api import Page, expect\n" + code
        
        return code
        
    except Exception as e:
        logger.error(f"Ошибка при генерации UI автотеста через Cloud.ru GigaChat: {e}")
        # Fallback
        return llm_client._fallback_test()