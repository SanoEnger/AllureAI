import React, { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Divider,
  Row,
  Col,
  Tabs,
} from 'antd'
import {
  SendOutlined,
  CodeOutlined,
  ApiOutlined,
  DesktopOutlined,
} from '@ant-design/icons'
import CodeDisplay from '../components/common/CodeDisplay'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { testService } from '../utils/api'
import { TEST_TYPES, TEST_PRIORITIES } from '../utils/constants'

const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

const TestCaseGenerator = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [testType, setTestType] = useState('api')

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const response = await testService.generateTestCase({
        test_type: values.test_type,
        requirements_text: values.requirements,
        openapi_spec: values.openapi_spec,
      })
      setGeneratedCode(response.code)
      message.success('Тест-кейс успешно сгенерирован!')
    } catch (error) {
      message.error(error.message || 'Ошибка при генерации тест-кейса')
      console.error('Generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    setGeneratedCode('')
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>
        <CodeOutlined /> Генератор тест-кейсов
      </h1>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Настройки генерации">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                test_type: 'api',
                priority: 'NORMAL',
              }}
            >
              <Form.Item
                name="test_type"
                label="Тип теста"
                rules={[{ required: true, message: 'Выберите тип теста' }]}
              >
                <Select
                  onChange={setTestType}
                  style={{ width: '100%' }}
                >
                  <Option value="ui">
                    <Space>
                      <DesktopOutlined /> UI тест
                    </Space>
                  </Option>
                  <Option value="api">
                    <Space>
                      <ApiOutlined /> API тест
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="priority"
                label="Приоритет"
              >
                <Select style={{ width: '100%' }}>
                  {Object.entries(TEST_PRIORITIES).map(([key, value]) => (
                    <Option key={key} value={value}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Divider orientation="left">Требования</Divider>

              <Form.Item
                name="requirements"
                label="Описание требований"
                rules={[{ required: true, message: 'Введите требования' }]}
              >
                <TextArea
                  rows={8}
                  placeholder="Опишите требования к тесту на русском языке...
Пример для API:
1. Тестирование эндпоинта GET /api/users
2. Проверка статус-кода 200
3. Проверка структуры JSON ответа
4. Проверка заголовков

Пример для UI:
1. Открытие страницы логина
2. Ввод корректных данных
3. Нажатие кнопки входа
4. Проверка перехода в личный кабинет"
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Divider orientation="left">OpenAPI спецификация (опционально)</Divider>

              <Form.Item name="openapi_spec" label="OpenAPI JSON/YAML">
                <TextArea
                  rows={4}
                  placeholder='{
  "openapi": "3.0.0",
  "info": {
    "title": "API",
    "version": "1.0.0"
  }
}'
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Form.Item>
                <Space size="large" style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={handleReset} size="large">
                    Очистить
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<SendOutlined />}
                    loading={loading}
                  >
                    Сгенерировать
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          {loading ? (
            <LoadingSpinner message="Генерация тест-кейса через Cloud.ru GigaChat..." />
          ) : generatedCode ? (
            <CodeDisplay code={generatedCode} title="Сгенерированный тест-кейс" />
          ) : (
            <Card
              title="Результат генерации"
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
                  <CodeOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <p style={{ fontSize: '16px' }}>
                    Здесь появится сгенерированный код тест-кейса в формате Allure TestOps as Code
                  </p>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Код будет включать:
                  </p>
                  <ul style={{ textAlign: 'left', display: 'inline-block', margin: '16px 0' }}>
                    <li>Allure декораторы (@feature, @story, @title)</li>
                    <li>Паттерн AAA (Arrange-Act-Assert)</li>
                    <li>Обработку ошибок</li>
                    <li>Готовый к запуску код</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Divider />

      <Card title="Примеры промптов" style={{ marginTop: 24 }}>
        <Tabs defaultActiveKey="api">
          <TabPane tab="API тест" key="api">
            <div style={{ background: '#f6f8fa', padding: '16px', borderRadius: '6px' }}>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px' }}>
{`Сгенерируй тест для REST API:
1. Эндпоинт: GET /api/v1/users
2. Проверить статус код 200
3. Проверить что возвращается массив пользователей
4. Проверить что каждый пользователь имеет поля: id, name, email
5. Добавить проверку времени ответа < 3 секунд
6. Использовать Bearer аутентификацию`}
              </pre>
            </div>
          </TabPane>
          <TabPane tab="UI тест" key="ui">
            <div style={{ background: '#f6f8fa', padding: '16px', borderRadius: '6px' }}>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px' }}>
{`Сгенерируй UI тест для страницы логина:
1. Открыть страницу /login
2. Ввести корректный email и пароль
3. Нажать кнопку "Войти"
4. Проверить переход на /dashboard
5. Проверить отображение приветствия
6. Добавить тест на неправильный пароль`}
              </pre>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default TestCaseGenerator