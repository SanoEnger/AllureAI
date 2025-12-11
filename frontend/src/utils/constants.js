export const TEST_TYPES = {
  UI: 'ui',
  API: 'api',
}

export const TEST_PRIORITIES = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  NORMAL: 'NORMAL',
  LOW: 'LOW',
}

export const API_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

export const DEMO_EXAMPLES = {
  UI: {
    title: 'UI Тест: Калькулятор',
    scenario: 'Проверить основные операции калькулятора:\n1. Открыть страницу калькулятора\n2. Ввести числа и операторы\n3. Проверить результат вычислений\n4. Проверить кнопку сброса',
  },
  API: {
    title: 'API Тест: Evolution Compute',
    scenario: 'Протестировать REST API для управления вычислениями:\n1. Создать задачу вычисления\n2. Получить статус задачи\n3. Получить результат вычисления\n4. Удалить задачу',
  },
}