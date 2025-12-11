import React, { useState, useEffect } from 'react'
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
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd'
import {
  ApiOutlined,
  UploadOutlined,
  FileTextOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons'
import CodeDisplay from '../components/common/CodeDisplay'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { testService } from '../utils/api'
import { API_METHODS } from '../utils/constants'

const { TextArea } = Input
const { Option } = Select
const { Title, Text } = Typography

const OpenAPIGenerator = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [openapiSpec, setOpenapiSpec] = useState('')
  const [endpoints, setEndpoints] = useState([])
  const [selectedEndpoints, setSelectedEndpoints] = useState([])

  const parseOpenAPI = (specText) => {
    setParsing(true)
    try {
      let spec
      if (typeof specText === 'string') {
        spec = JSON.parse(specText)
      } else {
        spec = specText
      }
      
      const parsedEndpoints = []
      if (spec.paths) {
        Object.entries(spec.paths).forEach(([path, methods]) => {
          Object.entries(methods).forEach(([method, details]) => {
            if (API_METHODS.includes(method.toUpperCase())) {
              parsedEndpoints.push({
                key: `${method}:${path}`,
                method: method.toUpperCase(),
                path,
                summary: details.summary || 'No description',
                parameters: details.parameters || [],
                hasBody: !!details.requestBody,
              })
            }
          })
        })
      }
      
      setEndpoints(parsedEndpoints)
      message.success(`Найдено ${parsedEndpoints.length} эндпоинтов`)
    } catch (error) {
      message.error('Ошибка парсинга OpenAPI спецификации')
      console.error('Parse error:', error)
    } finally {
      setParsing(false)
    }
  }

  const handleFileUpload = (info) => {
    const { file } = info
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      setOpenapiSpec(content)
      form.setFieldValue('openapi_spec', content)
      parseOpenAPI(content)
    }
    reader.readAsText(file.originFileObj)
  }

  const handleParse = () => {
    const spec = form.getFieldValue('openapi_spec')
    if (!spec) {
      message.warning('Введите или загрузите OpenAPI спецификацию')
      return
    }
    setOpenapiSpec(spec)
    parseOpenAPI(spec)
  }

  const handleGenerate = async () => {
    if (selectedEndpoints.length === 0) {
      message.warning('Выберите хотя бы один эндпоинт')
      return
    }

    setLoading(true)
    try {
      const endpoint = selectedEndpoints[0]
      const response = await testService.generateAutotest({
        target: 'api',
        openapi_spec: openapiSpec,
        method: endpoint.method,
        path: endpoint.path,
      })
      setGeneratedCode(response.code)
      message.success('API тест успешно сгенерирован!')
    } catch (error) {
      message.error(error.message || 'Ошибка при генерации API теста')
      console.error('Generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    setOpenapiSpec('')
    setEndpoints([])
    setSelectedEndpoints([])
    setGeneratedCode('')
  }

  const columns = [
    {
      title: 'Выбор',
      dataIndex: 'key',
      render: (text, record) => (
        <input
          type="radio"
          name="endpoint"
          checked={selectedEndpoints[0]?.key === record.key}
          onChange={() => setSelectedEndpoints([record])}
        />
      ),
    },
    {
      title: 'Метод',
      dataIndex: 'method',
      render: (method) => {
        const color = {
          GET: 'green',
          POST: 'blue',
          PUT: 'orange',
          PATCH: 'yellow',
          DELETE: 'red',
        }[method]
        return <Tag color={color}>{method}</Tag>
      },
    },
    {
      title: 'Путь',
      dataIndex: 'path',
      render: (path) => <code>{path}</code>,
    },
    {
      title: 'Описание',
      dataIndex: 'summary',
    },
    {
      title: 'Параметры',
      dataIndex: 'parameters',
      render: (params) => params.length,
    },
    {
      title: 'Тело',
      dataIndex: 'hasBody',
      render: (hasBody) => hasBody ? '✓' : '✗',
    },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>
        <ApiOutlined /> OpenAPI генератор автотестов
      </h1>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="OpenAPI спецификация">
            <Form form={form} layout="vertical">
              <Form.Item>
                <Upload
                  name="file"
                  accept=".json,.yaml,.yml"
                  showUploadList={false}
                  customRequest={({ onSuccess }) => setTimeout(() => onSuccess('ok'), 0)}
                  onChange={handleFileUpload}
                >
                  <Button icon={<UploadOutlined />} style={{ width: '100%' }} size="large">
                    Загрузить OpenAPI файл
                  </Button>
                </Upload>
              </Form.Item>

              <Divider>Или вставьте вручную</Divider>

              <Form.Item name="openapi_spec" label="OpenAPI JSON/YAML">
                <TextArea
                  rows={10}
                  placeholder='{
  "openapi": "3.0.0",
  "info": {
    "title": "Пример API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "Получить список пользователей",
        "responses": {
          "200": {
            "description": "Успешный ответ"
          }
        }
      }
    }
  }
}'
                  style={{ fontFamily: 'monospace', fontSize: '14px' }}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    onClick={handleParse}
                    loading={parsing}
                    icon={<SearchOutlined />}
                    type="primary"
                  >
                    Парсить спецификацию
                  </Button>
                  <Button onClick={handleReset}>
                    Очистить
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          {endpoints.length > 0 && (
            <Card title="Обнаруженные эндпоинты" style={{ marginTop: 24 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Выберите эндпоинт для генерации теста
              </Text>
              <Table
                columns={columns}
                dataSource={endpoints}
                pagination={{ pageSize: 5 }}
                size="small"
                rowKey="key"
              />
              <Divider />
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleGenerate}
                loading={loading}
                disabled={selectedEndpoints.length === 0}
                style={{ width: '100%' }}
              >
                Сгенерировать автотест для выбранного эндпоинта
              </Button>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={12}>
          {loading ? (
            <LoadingSpinner message="Генерация API автотеста через Cloud.ru GigaChat..." />
          ) : generatedCode ? (
            <CodeDisplay code={generatedCode} title="Сгенерированный API автотест" />
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
                  <ApiOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <Title level={4} style={{ color: '#666' }}>
                    Генератор API автотестов
                  </Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Загрузите OpenAPI спецификацию для автоматической генерации тестов
                  </Text>
                  <div style={{ textAlign: 'left', margin: '0 auto', maxWidth: '500px' }}>
                    <p style={{ marginBottom: 8 }}>Что будет сгенерировано:</p>
                    <ul style={{ marginBottom: 24 }}>
                      <li>Тесты для каждого эндпоинта</li>
                      <li>Позитивные и негативные сценарии</li>
                      <li>Валидация JSON схем</li>
                      <li>Проверка статус-кодов</li>
                      <li>Аутентификация (Bearer token)</li>
                      <li>Параметризованные тесты</li>
                    </ul>
                    <p>
                      <FileTextOutlined /> Поддерживаемые форматы: JSON, YAML
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}

export default OpenAPIGenerator