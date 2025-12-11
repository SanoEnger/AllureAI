"""
LLM клиент для работы с Cloud.ru GigaChat через OpenAI-совместимый API
"""
import json
import time
from typing import Any, Dict, List, Optional
import hashlib
from dataclasses import dataclass
from datetime import datetime

from openai import AsyncOpenAI
from loguru import logger

from config import get_settings


@dataclass
class GenerationMetrics:
    """Метрики генерации для мониторинга"""
    prompt_hash: str
    prompt_length: int
    response_length: int
    generation_time_ms: float
    cache_hit: bool
    success: bool
    timestamp: datetime
    model_used: str = ""
    validation_issues: List[str] = None


class LLMClient:
    """Клиент для работы с Cloud.ru GigaChat через OpenAI SDK"""
    
    def __init__(self) -> None:
        self.settings = get_settings()
        
        # Инициализируем OpenAI клиент для Cloud.ru
        # Cloud.ru использует OpenAI-совместимый API
        self._client = AsyncOpenAI(
            api_key=self.settings.LLM_API_KEY,
            base_url=self.settings.LLM_BASE_URL,
            timeout=self.settings.LLM_TIMEOUT_SECONDS,
            max_retries=self.settings.LLM_MAX_RETRIES,
        )
        
        self._cache: Dict[str, str] = {}
        self.metrics: List[GenerationMetrics] = []
        
        logger.info(f"Инициализирован LLMClient для Cloud.ru GigaChat")
        logger.info(f"Модель: {self.settings.LLM_MODEL}")
        logger.info(f"Base URL: {self.settings.LLM_BASE_URL}")
    
    def _generate_cache_key(self, messages: List[Dict], params: dict) -> str:
        """Генерация ключа для кэширования"""
        content = f"{json.dumps(messages, sort_keys=True)}_{params.get('temperature', 0.3)}_{params.get('max_tokens', 2048)}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def _validate_response(self, response: str) -> tuple[str, List[str]]:
        """
        Валидирует ответ LLM и возвращает исправленный код + список проблем
        
        Returns:
            tuple: (исправленный_код, список_проблем)
        """
        issues = []
        
        # Проверяем наличие обязательных элементов для тестов
        checks = [
            ("import allure", "Отсутствует import allure"),
            ("def test_", "Нет тестовых функций test_"),
            ("class Test", "Нет тестового класса"),
        ]
        
        for check, msg in checks:
            if check.lower() not in response.lower():
                issues.append(msg)
        
        # Автоматически исправляем некоторые проблемы
        fixed_response = response
        
        # Убираем лишние markdown обрамления
        import re
        pattern = r"```(?:python)?\n?(.*?)```"
        matches = re.findall(pattern, fixed_response, re.DOTALL | re.IGNORECASE)
        if matches:
            fixed_response = matches[0].strip()
        
        # Добавляем импорт allure если есть тесты
        if "import allure" not in fixed_response.lower() and "def test_" in fixed_response.lower():
            fixed_response = "import allure\n\n" + fixed_response
            issues.append("Добавлен импорт allure")
        
        return fixed_response, issues
    
    async def _generate_with_openai(
        self, 
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 2048
    ) -> str:
        """
        Генерация через OpenAI-совместимый API (Cloud.ru GigaChat)
        """
        try:
            logger.debug(f"Отправка запроса к Cloud.ru GigaChat, модель: {self.settings.LLM_MODEL}")
            
            response = await self._client.chat.completions.create(
                model=self.settings.LLM_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=0.9,
                frequency_penalty=0.1,
                presence_penalty=0.1,
            )
            
            # Извлекаем контент из ответа
            if response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content
                if content:
                    logger.debug(f"Получен ответ от Cloud.ru GigaChat, длина: {len(content)} символов")
                    return content
            
            logger.warning("Пустой ответ от Cloud.ru GigaChat")
            return ""
            
        except Exception as e:
            logger.error(f"Ошибка при запросе к Cloud.ru GigaChat: {e}")
            
            # Детальный анализ ошибок
            error_msg = str(e).lower()
            if "401" in error_msg or "unauthorized" in error_msg:
                logger.error("Ошибка аутентификации. Проверьте LLM_API_KEY")
            elif "404" in error_msg:
                logger.error(f"Модель {self.settings.LLM_MODEL} не найдена или неверный URL: {self.settings.LLM_BASE_URL}")
            elif "429" in error_msg:
                logger.error("Превышен лимит запросов. Попробуйте позже")
            elif "connection" in error_msg:
                logger.error("Ошибка подключения. Проверьте сеть или URL")
            
            raise
    
    async def generate(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        use_cache: bool = True, 
        validate: bool = True
    ) -> str:
        """
        Генерирует ответ на промпт через Cloud.ru GigaChat
        
        Args:
            prompt: Текст промпта пользователя
            system_prompt: Системный промпт (роль AI)
            use_cache: Использовать кэширование
            validate: Валидировать ответ
        
        Returns:
            Сгенерированный текст
        """
        start_time = time.time()
        cache_hit = False
        prompt_hash = None
        
        try:
            # Системный промпт по умолчанию для QA
            if system_prompt is None:
                system_prompt = (
                    "Ты — Senior QA Automation Engineer с 10+ лет опыта. "
                    "Ты специализируешься на генерации production-ready тестов на Python. "
                    "Твой код должен быть чистым, читаемым и сразу готовым к запуску. "
                    "Ты строго следуешь паттерну AAA (Arrange-Act-Assert). "
                    "Ты всегда используешь Allure для отчетности. "
                    "Ты пишешь тесты, которые легко поддерживать и расширять."
                )
            
            # Подготовка сообщений для API
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            # Параметры запроса
            params = {
                "temperature": self.settings.LLM_TEMPERATURE,
                "max_tokens": self.settings.LLM_MAX_TOKENS,
            }
            
            # Кэширование
            if use_cache:
                prompt_hash = self._generate_cache_key(messages, params)
                if prompt_hash in self._cache:
                    cache_hit = True
                    logger.info(f"Кэш-попадание для промпта: {prompt_hash}")
                    raw_response = self._cache[prompt_hash]
                else:
                    raw_response = await self._generate_with_openai(messages, **params)
                    self._cache[prompt_hash] = raw_response
                    logger.info(f"Добавлено в кэш: {prompt_hash}")
            else:
                raw_response = await self._generate_with_openai(messages, **params)
            
            # Валидация и пост-обработка
            if validate:
                validated_response, validation_issues = self._validate_response(raw_response)
                if validation_issues:
                    logger.warning(f"Проблемы валидации: {validation_issues}")
            else:
                validated_response = raw_response
                validation_issues = []
            
            # Запись метрик
            generation_time_ms = (time.time() - start_time) * 1000
            metrics = GenerationMetrics(
                prompt_hash=prompt_hash or self._generate_cache_key(messages, params),
                prompt_length=len(prompt),
                response_length=len(validated_response),
                generation_time_ms=generation_time_ms,
                cache_hit=cache_hit,
                success=True,
                timestamp=datetime.now(),
                model_used=self.settings.LLM_MODEL,
                validation_issues=validation_issues
            )
            self.metrics.append(metrics)
            
            logger.info(
                f"Генерация завершена: {generation_time_ms:.1f}ms, "
                f"длина ответа: {len(validated_response)}, "
                f"кэш: {'hit' if cache_hit else 'miss'}, "
                f"модель: {self.settings.LLM_MODEL}"
            )
            
            return validated_response
            
        except Exception as e:
            generation_time_ms = (time.time() - start_time) * 1000
            logger.error(f"Ошибка генерации Cloud.ru GigaChat: {e}, время: {generation_time_ms:.1f}ms")
            
            # Запись метрик ошибки
            metrics = GenerationMetrics(
                prompt_hash=prompt_hash or "error",
                prompt_length=len(prompt),
                response_length=0,
                generation_time_ms=generation_time_ms,
                cache_hit=cache_hit,
                success=False,
                timestamp=datetime.now(),
                model_used=self.settings.LLM_MODEL,
                validation_issues=[f"Ошибка: {str(e)}"]
            )
            self.metrics.append(metrics)
            
            # Fallback на локальный шаблон
            return self._fallback_test()
    
    @staticmethod
    def _fallback_test() -> str:
        """Fallback тест при недоступности Cloud.ru GigaChat"""
        return (
            "import allure\n"
            "import pytest\n\n"
            "class TestFallbackCloudRu:\n"
            "    \"\"\"Fallback тест при недоступности Cloud.ru GigaChat\"\"\"\n\n"
            "    @allure.feature('fallback')\n"
            "    @allure.story('cloudru_unavailable')\n"
            "    @allure.title('Fallback test - Cloud.ru GigaChat unavailable')\n"
            "    @allure.tag('LOW')\n"
            "    @allure.label('owner', 'autogenerated')\n"
            "    @allure.label('source', 'fallback_cloudru')\n"
            "    def test_fallback_cloudru(self):\n"
            "        \"\"\"Базовый fallback тест при ошибке Cloud.ru\"\"\"\n"
            "        with allure.step('Arrange'):\n"
            "            expected = 2\n"
            "        \n"
            "        with allure.step('Act'):\n"
            "            result = 1 + 1\n"
            "        \n"
            "        with allure.step('Assert'):\n"
            "            assert result == expected, f'Ожидалось {{expected}}, получено {{result}}'\n"
        )
    
    def get_metrics_summary(self) -> dict:
        """Возвращает сводку метрик"""
        if not self.metrics:
            return {
                "model": self.settings.LLM_MODEL,
                "total_requests": 0,
                "provider": "Cloud.ru GigaChat"
            }
        
        successful = [m for m in self.metrics if m.success]
        failed = [m for m in self.metrics if not m.success]
        
        return {
            "model": self.settings.LLM_MODEL,
            "provider": "Cloud.ru GigaChat",
            "total_requests": len(self.metrics),
            "successful": len(successful),
            "failed": len(failed),
            "cache_hit_rate": len([m for m in self.metrics if m.cache_hit]) / len(self.metrics) if self.metrics else 0,
            "avg_generation_time_ms": sum(m.generation_time_ms for m in successful) / len(successful) if successful else 0,
            "avg_response_length": sum(m.response_length for m in successful) / len(successful) if successful else 0,
            "base_url": self.settings.LLM_BASE_URL,
        }


# Глобальный инстанс клиента
llm_client = LLMClient()