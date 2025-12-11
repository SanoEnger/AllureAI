import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  message,
  Typography,
  Divider,
  List,
  Tag,
  Alert,
  Tabs,
} from 'antd'
import {
  RocketOutlined,
  PlayCircleOutlined,
  CopyOutlined,
  ApiOutlined,
  DesktopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import CodeDisplay from '../components/common/CodeDisplay'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { testService } from '../utils/api'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

const Demos = () => {
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [activeDemo, setActiveDemo] = useState(null)

  const demos = [
    {
      key: 'ui_calculator',
      title: 'UI: Тестирование калькулятора',
      type: 'ui',
      icon: <DesktopOutlined />,
      description: 'Тестирование основных операций веб-калькулятора',
      scenario: `Сценарий тестирования калькулятора:
1. Открыть страницу калькулятора
2. Проверить наличие всех кнопок (цифры, операторы, равно, сброс)
3. Выполнить операцию сложения: 5 + 3 = 8
4. Выполнить операцию вычитания: 10 - 4 = 6
5. Выполнить операцию умножения: 6 * 7 = 42
6. Выполнить операцию деления: 20 / 4 = 5
7. Проверить кнопку сброса (C)
8. Проверить обработку ошибок (деление на 0)`,
      tags: ['UI', 'Playwright', 'Allure'],
    },
    {
      key: 'api_users',
      title: 'API: Управление пользователями',
      type: 'api',
      icon: <ApiOutlined />,
      description: 'Полный CRUD для REST API пользователей',
      scenario: `API тестирование CRUD операций:
1. Создание нового пользователя (POST /users)
2. Получение списка пользователей (GET /users)
3. Получение конкретного пользователя (GET /users/{id})
4. Обновление пользователя (PUT /users/{id})
5. Удаление пользователя (DELETE /users/{id})
6. Валидация данных
7. Тестирование граничных случаев
8. Проверка аутентификации и авторизации`,
      tags: ['API', 'REST', 'CRUD', 'Authentication'],
    },
    {
      key: 'api_auth',
      title: 'API: Аутентификация и JWT',
      type: 'api',
      icon: <ApiOutlined />,
      description: 'Тестирование системы аутентификации с JWT токенами',
      scenario: `Тестирование системы аутентификации:
1. Регистрация нового пользователя
2. Логин с корректными данными
3. Получение и проверка JWT токена
4. Доступ к защищенному эндпоинту с токеном
5. Обновление токена (refresh token)
6. Логаут и инвалидация токена
7. Тестирование невалидных токенов
8. Проверка времени жизни токена`,
      tags: ['API', 'JWT', 'Authentication', 'Security'],
    },
    {
      key: 'ui_ecommerce',
      title: 'UI: Интернет-магазин',
      type: 'ui',
      icon: <DesktopOutlined />,
      description: 'Тестирование основных сценариев интернет-магазина',
      scenario: `Тестирование интернет-магазина:
1. Просмотр каталога товаров
2. Фильтрация и сортировка товаров
3. Поиск товаров
4. Добавление товара в корзину
5. Оформление заказа
6. Регистрация и вход пользователя
7. Проверка истории заказов
8. Тестирование адаптивного дизайна`,
      tags: ['UI', 'E-commerce', 'Playwright', 'Responsive'],
    },
  ]

  const handleRunDemo = async (demo) => {
    setActiveDemo(demo)
    setLoading(true)
    setGeneratedCode('')

    try {
      let response
      if (demo.type === 'api') {
        response = await testService.generateTestCase({
          test_type: 'api',
          requirements_text: demo.scenario,
        })
      } else {
        response = await testService.generateTestCase({
          test_type: 'ui',
          requirements_text: demo.scenario,
        })
      }
      
      setGeneratedCode(response.code)
      message.success(`Демо "${demo.title}" успешно сгенерировано!`)
    } catch (error) {
      message.error(error.message || 'Ошибка при генерации демо')
      console.error('Demo generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyScenario = (scenario) => {
    navigator.clipboard.writeText(scenario)
    message.success('Сценарий скопирован в буфер обмена')
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>
        <RocketOutlined /> Демо-примеры
      </h1>

      <Alert
        message="Быстрый старт"
        description="Используйте готовые примеры для быстрой генерации тестов. Выберите демо и нажмите 'Запустить демо'"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Доступные демо-примеры">
            <List
              dataSource={demos}
              renderItem={(demo) => (
                <List.Item
                  actions={[
                    <Button
                      key="run"
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleRunDemo(demo)}
                    >
                      Запустить демо
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={demo.icon}
                    title={
                      <Space>
                        {demo.title}
                        {demo.tags.map(tag => (
                          <Tag key={tag} color={demo.type === 'api' ? 'blue' : 'green'}>
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }}>
                          {demo.description}
                        </Paragraph>
                        <Space>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyScenario(demo.scenario)}
                          >
                            Копировать сценарий
                          </Button>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="Преимущества демо-примеров" style={{ marginTop: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Space direction="vertical" align="center">
                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <Text strong>Быстрый старт</Text>
                    <Text type="secondary" style={{ textAlign: 'center' }}>
                      Начните тестирование без написания кода
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Space direction="vertical" align="center">
                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <Text strong>Best Practices</Text>
                    <Text type="secondary" style={{ textAlign: 'center' }}>
                      Готовые шаблоны по лучшим практикам
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Space direction="vertical" align="center">
                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
                    <Text strong>Обучение</Text>
                    <Text type="secondary" style={{ textAlign: 'center' }}>
                      Изучайте подходы к тестированию
                    </Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Space direction="vertical" align="center">
                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
                    <Text strong>Кастомизация</Text>
                    <Text type="secondary" style={{ textAlign: 'center' }}>
                      Легко адаптируйте под свои нужды
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          {loading ? (
            <LoadingSpinner message={`Генерация демо "${activeDemo?.title}" через Cloud.ru GigaChat...`} />
          ) : generatedCode ? (
            <CodeDisplay 
              code={generatedCode} 
              title={`Демо: ${activeDemo?.title}`}
            />
          ) : (
            <Card
              title="Результат генерации демо"
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                color: '#999',
                textAlign: 'center'
              }}>
                <div>
                  <RocketOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: '#666' }}>
                    Готовые примеры тестов
                  </Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Выберите демо-пример слева для генерации готового тест-кейса
                  </Text>
                  
                  <Divider>Что вы получите</Divider>
                  
                  <Row gutter={[16, 16]} style={{ textAlign: 'left' }}>
                    <Col span={12}>
                      <Space direction="vertical">
                        <Text strong><ApiOutlined /> API тесты:</Text>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          <li>Полный CRUD тест</li>
                          <li>Валидация JSON схем</li>
                          <li>Аутентификация</li>
                          <li>Параметризация</li>
                        </ul>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical">
                        <Text strong><DesktopOutlined /> UI тесты:</Text>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          <li>Page Object Model</li>
                          <li>Явные ожидания</li>
                          <li>Скриншоты при падении</li>
                          <li>Адаптивный дизайн</li>
                        </ul>
                      </Space>
                    </Col>
                  </Row>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Divider />

      <Card title="Как использовать демо-примеры" style={{ marginTop: 24 }}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Шаг 1: Выбор демо" key="1">
            <Space direction="vertical" size="middle">
              <Text>Выберите подходящий демо-пример из списка:</Text>
              <ul>
                <li><strong>Для начинающих:</strong> UI калькулятор - простой пример тестирования веб-приложения</li>
                <li><strong>Для API тестирования:</strong> Управление пользователями - полный CRUD тест</li>
                <li><strong>Для безопасности:</strong> JWT аутентификация - тестирование системы безопасности</li>
                <li><strong>Для комплексного тестирования:</strong> Интернет-магазин - полный пользовательский сценарий</li>
              </ul>
            </Space>
          </TabPane>
          <TabPane tab="Шаг 2: Генерация" key="2">
            <Space direction="vertical" size="middle">
              <Text>Нажмите "Запустить демо" для генерации теста:</Text>
              <ul>
                <li>AI-агент создаст полный тест-кейс на основе выбранного сценария</li>
                <li>Код будет включать все необходимые импорты, декораторы и проверки</li>
                <li>Тест готов к запуску без дополнительной настройки</li>
              </ul>
            </Space>
          </TabPane>
          <TabPane tab="Шаг 3: Кастомизация" key="3">
            <Space direction="vertical" size="middle">
              <Text>Адаптируйте сгенерированный код под свои нужды:</Text>
              <ul>
                <li>Измените URL, данные, assertions</li>
                <li>Добавьте дополнительные проверки</li>
                <li>Интегрируйте в свою тестовую инфраструктуру</li>
                <li>Используйте как шаблон для создания новых тестов</li>
              </ul>
            </Space>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default Demos