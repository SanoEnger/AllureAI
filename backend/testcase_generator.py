import re
from typing import Any

from llm_client import llm_client
from prompt_templates import PromptTemplates, TestType, TestPriority, get_testcase_prompt
from loguru import logger

logger.add("logs/app.log", rotation="500 MB", retention="10 days")


def _extract_python_code(text: str) -> str:
    """Извлекает Python код из markdown блоков или текста ответа LLM"""
    # Вариант 1: Ищем блоки кода в markdown
    pattern = r"```(?:python)?\n?(.*?)```"
    matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
    
    if matches:
        return matches[0].strip()
    
    # Вариант 2: Если нет блоков, ищем импорт allure как начало кода
    lines = text.split('\n')
    code_lines = []
    in_code_block = False
    
    for line in lines:
        if any(keyword in line.lower() for keyword in ["import ", "def ", "class ", "@allure", "with allure"]):
            in_code_block = True
        if in_code_block:
            code_lines.append(line)
    
    if code_lines:
        return '\n'.join(code_lines).strip()
    
    return text.strip()


async def generate_testcase(
    test_type: str,
    requirements_text: str | None = None,
    openapi_spec: Any | None = None,
) -> str:
    """
    Генерирует тест-кейс в формате Allure TestOps as Code
    используя Cloud.ru GigaChat
    """
    logger.info(f"Генерация тест-кейса типа: {test_type} через Cloud.ru GigaChat")
    
    if not requirements_text and not openapi_spec:
        raise ValueError("Необходимо предоставить либо requirements_text, либо openapi_spec")

    # Формируем описание требований
    if openapi_spec is not None:
        req = f"OpenAPI спецификация:\n{openapi_spec}"
    else:
        req = requirements_text or ""

    # Определяем приоритет и тип теста
    test_type_enum = TestType.API if test_type == "api" else TestType.UI
    priority = TestPriority.CRITICAL if test_type == "api" else TestPriority.NORMAL
    
    try:
        # Используем промпт-шаблоны для GigaChat
        prompt, params = get_testcase_prompt(
            requirements=req,
            test_type=test_type_enum,
            priority=priority
        )
        
        logger.debug(f"Отправка промпта Cloud.ru GigaChat, длина: {len(prompt)} символов")
        
        # Генерация через Cloud.ru GigaChat с системным промптом
        raw = await llm_client.generate(
            prompt=prompt,
            system_prompt=params.get("system_role"),
            use_cache=True,
            validate=True
        )
        
        logger.debug(f"Получен ответ от Cloud.ru GigaChat, длина: {len(raw)} символов")
        
        code = _extract_python_code(raw)
        logger.debug(f"Извлечен код, длина: {len(code)} символов")
        
        # Базовая валидация и исправление
        if "import allure" not in code and "test_" in code:
            code = "import allure\n\n" + code
            logger.info("Добавлен импорт allure")
        
        return code
        
    except Exception as e:
        logger.error(f"Ошибка при генерации тест-кейса через Cloud.ru GigaChat: {e}")
        # Fallback на простой тест
        return llm_client._fallback_test()