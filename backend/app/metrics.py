"""
Сбор и экспорт метрик для мониторинга AI-агента
"""
from typing import Dict, List, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import defaultdict
import statistics

from loguru import logger


@dataclass
class AgentMetrics:
    """Метрики AI-агента"""
    timestamp: datetime
    total_requests: int
    successful_requests: int
    failed_requests: int
    cache_hit_rate: float
    avg_generation_time_ms: float
    avg_response_length: int
    requests_by_type: Dict[str, int]
    errors_by_type: Dict[str, int]
    
    def to_dict(self) -> Dict[str, Any]:
        """Конвертация в словарь"""
        result = asdict(self)
        result["timestamp"] = self.timestamp.isoformat()
        return result


class MetricsCollector:
    """Сборщик метрик для AI-агента"""
    
    def __init__(self):
        self.metrics_history: List[AgentMetrics] = []
        self.request_types = defaultdict(int)
        self.error_types = defaultdict(int)
        
        logger.info("Инициализирован MetricsCollector")
    
    def record_request(
        self,
        request_type: str,
        success: bool,
        generation_time_ms: float,
        response_length: int,
        cache_hit: bool = False
    ):
        """
        Запись метрик запроса
        
        Args:
            request_type: Тип запроса (testcase, autotest_api, autotest_ui)
            success: Успешность запроса
            generation_time_ms: Время генерации в мс
            response_length: Длина ответа
            cache_hit: Попадание в кэш
        """
        self.request_types[request_type] += 1
        
        if not success:
            self.error_types[request_type] += 1
        
        # Логируем медленные запросы
        if generation_time_ms > 10000:  # > 10 секунд
            logger.warning(
                f"Медленный запрос {request_type}: {generation_time_ms:.1f}ms"
            )
    
    def collect_metrics(self, llm_client) -> AgentMetrics:
        """
        Сбор агрегированных метрик
        
        Args:
            llm_client: Клиент LLM для получения его метрик
        """
        # Получаем метрики из LLM клиента
        llm_summary = llm_client.get_metrics_summary() if hasattr(llm_client, 'get_metrics_summary') else {}
        
        # Рассчитываем cache hit rate
        total_requests = sum(self.request_types.values())
        if total_requests > 0:
            error_rate = sum(self.error_types.values()) / total_requests
        else:
            error_rate = 0
        
        metrics = AgentMetrics(
            timestamp=datetime.now(),
            total_requests=total_requests,
            successful_requests=total_requests - sum(self.error_types.values()),
            failed_requests=sum(self.error_types.values()),
            cache_hit_rate=llm_summary.get('cache_hit_rate', 0),
            avg_generation_time_ms=llm_summary.get('avg_generation_time_ms', 0),
            avg_response_length=int(llm_summary.get('avg_response_length', 0)),
            requests_by_type=dict(self.request_types),
            errors_by_type=dict(self.error_types),
        )
        
        self.metrics_history.append(metrics)
        
        # Очищаем старые метрики (храним только последние 1000)
        if len(self.metrics_history) > 1000:
            self.metrics_history = self.metrics_history[-1000:]
        
        return metrics
    
    def get_recent_metrics(self, hours: int = 1) -> List[AgentMetrics]:
        """
        Получить метрики за последние N часов
        
        Args:
            hours: Количество часов
            
        Returns:
            Список метрик
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)
        return [
            m for m in self.metrics_history
            if m.timestamp >= cutoff_time
        ]
    
    def get_summary_stats(self, hours: int = 24) -> Dict[str, Any]:
        """
        Получить сводную статистику
        
        Args:
            hours: Количество часов для анализа
            
        Returns:
            Словарь со статистикой
        """
        recent_metrics = self.get_recent_metrics(hours)
        
        if not recent_metrics:
            return {"message": "Нет данных за указанный период"}
        
        # Собираем данные
        generation_times = []
        response_lengths = []
        
        for metric in recent_metrics:
            if metric.avg_generation_time_ms > 0:
                generation_times.append(metric.avg_generation_time_ms)
            if metric.avg_response_length > 0:
                response_lengths.append(metric.avg_response_length)
        
        # Рассчитываем статистику
        stats = {
            "period_hours": hours,
            "total_requests": sum(m.total_requests for m in recent_metrics),
            "success_rate": (
                sum(m.successful_requests for m in recent_metrics) / 
                sum(m.total_requests for m in recent_metrics)
                if sum(m.total_requests for m in recent_metrics) > 0 else 0
            ),
            "avg_cache_hit_rate": statistics.mean(
                [m.cache_hit_rate for m in recent_metrics if m.cache_hit_rate > 0]
            ) if any(m.cache_hit_rate > 0 for m in recent_metrics) else 0,
            "avg_generation_time_ms": statistics.mean(generation_times) if generation_times else 0,
            "p95_generation_time_ms": (
                sorted(generation_times)[int(len(generation_times) * 0.95)]
                if generation_times else 0
            ),
            "avg_response_length": statistics.mean(response_lengths) if response_lengths else 0,
            "requests_by_type": defaultdict(int),
            "errors_by_type": defaultdict(int),
        }
        
        # Агрегируем по типам
        for metric in recent_metrics:
            for req_type, count in metric.requests_by_type.items():
                stats["requests_by_type"][req_type] += count
            for err_type, count in metric.errors_by_type.items():
                stats["errors_by_type"][err_type] += count
        
        # Конвертируем defaultdict в dict
        stats["requests_by_type"] = dict(stats["requests_by_type"])
        stats["errors_by_type"] = dict(stats["errors_by_type"])
        
        return stats
    
    def export_metrics_prometheus(self) -> str:
        """
        Экспорт метрик в формате Prometheus
        
        Returns:
            Строка с метриками в формате Prometheus
        """
        if not self.metrics_history:
            return "# Нет метрик\n"
        
        latest = self.metrics_history[-1]
        
        metrics_lines = [
            "# HELP aitest_agent_requests_total Total number of requests",
            "# TYPE aitest_agent_requests_total counter",
            f"aitest_agent_requests_total {latest.total_requests}",
            "",
            "# HELP aitest_agent_requests_successful_total Total successful requests",
            "# TYPE aitest_agent_requests_successful_total counter",
            f"aitest_agent_requests_successful_total {latest.successful_requests}",
            "",
            "# HELP aitest_agent_cache_hit_rate Cache hit rate",
            "# TYPE aitest_agent_cache_hit_rate gauge",
            f"aitest_agent_cache_hit_rate {latest.cache_hit_rate}",
            "",
            "# HELP aitest_agent_generation_time_ms Average generation time in milliseconds",
            "# TYPE aitest_agent_generation_time_ms gauge",
            f"aitest_agent_generation_time_ms {latest.avg_generation_time_ms}",
            "",
            "# HELP aitest_agent_response_length Average response length",
            "# TYPE aitest_agent_response_length gauge",
            f"aitest_agent_response_length {latest.avg_response_length}",
        ]
        
        # Добавляем метрики по типам
        for req_type, count in latest.requests_by_type.items():
            metrics_lines.extend([
                "",
                f"# HELP aitest_agent_requests_by_type_total Requests by type",
                "# TYPE aitest_agent_requests_by_type_total counter",
                f'ai_test_agent_requests_by_type_total{{type="{req_type}"}} {count}',
            ])
        
        return "\n".join(metrics_lines)


# Глобальный инстанс сборщика метрик
metrics_collector = MetricsCollector()