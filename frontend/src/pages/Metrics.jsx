import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Typography,
  Divider,
  Select,
  Button,
  Progress,
  Alert,
  Timeline,
  List,
} from 'antd'
import {
  DashboardOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  UserOutlined,
} from '@ant-design/icons'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { testService } from '../utils/api'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

const Metrics = () => {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [summary, setSummary] = useState(null)
  const [timeRange, setTimeRange] = useState(24)
  const [prometheusMetrics, setPrometheusMetrics] = useState('')

  useEffect(() => {
    loadMetrics()
  }, [timeRange])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const [metricsData, summaryData, prometheusData] = await Promise.all([
        testService.getMetrics(),
        testService.getMetricsSummary(timeRange),
        testService.getPrometheusMetrics(),
      ])
      setMetrics(metricsData)
      setSummary(summaryData)
      setPrometheusMetrics(prometheusData)
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadMetrics()
  }

  const handleTimeRangeChange = (value) => {
    setTimeRange(value)
  }

  if (loading) {
    return <LoadingSpinner message="Загрузка метрик AI-агента..." />
  }

  const metricColumns = [
    {
      title: 'Метрика',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Значение',
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => {
        if (record.type === 'rate') {
          return <Progress percent={value * 100} size="small" />
        } else if (record.type === 'time') {
          return <Text>{value.toFixed(2)} ms</Text>
        } else if (record.type === 'count') {
          return <Tag color="blue">{value}</Tag>
        }
        return <Text>{value}</Text>
      },
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
    },
  ]

  const requestTypeColumns = [
    {
      title: 'Тип запроса',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          'testcase_generation': 'blue',
          'autotest_api': 'green',
          'autotest_ui': 'purple',
          'validation': 'orange',
        }
        return <Tag color={colors[type] || 'default'}>{type}</Tag>
      },
    },
    {
      title: 'Количество',
      dataIndex: 'count',
      key: 'count',
      render: (count) => <Text strong>{count}</Text>,
    },
    {
      title: 'Успешно',
      dataIndex: 'success',
      key: 'success',
      render: (success) => (
        <Tag color={success ? 'green' : 'red'}>
          {success ? '✓' : '✗'}
        </Tag>
      ),
    },
  ]

  const recentActivity = [
    {
      time: '2 минуты назад',
      action: 'Сгенерирован UI тест',
      user: 'admin',
      status: 'success',
    },
    {
      time: '5 минут назад',
      action: 'Валидация тест-кейса',
      user: 'tester',
      status: 'success',
    },
    {
      time: '15 минут назад',
      action: 'Генерация API автотеста',
      user: 'developer',
      status: 'success',
    },
    {
      time: '1 час назад',
      action: 'Ошибка генерации',
      user: 'admin',
      status: 'error',
    },
    {
      time: '2 часа назад',
      action: 'Загрузка OpenAPI',
      user: 'tester',
      status: 'success',
    },
  ]

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>
          <DashboardOutlined /> Метрики AI-агента
        </h1>
        <Space>
          <Select
            value={timeRange}
            onChange={handleTimeRangeChange}
            style={{ width: 120 }}
          >
            <Option value={1}>1 час</Option>
            <Option value={6}>6 часов</Option>
            <Option value={24}>24 часа</Option>
            <Option value={168}>7 дней</Option>
          </Select>
          <Button onClick={handleRefresh} icon={<LineChartOutlined />}>
            Обновить
          </Button>
        </Space>
      </Space>

      <Alert
        message="Мониторинг производительности AI-агента"
        description="Статистика работы AI-агента по генерации тестов через Cloud.ru GigaChat"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Основные метрики */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Всего запросов"
              value={metrics?.total_requests || 0}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Успешных"
              value={metrics?.successful_requests || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Среднее время"
              value={metrics?.avg_generation_time_ms || 0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Cache Hit Rate"
              value={(metrics?.cache_hit_rate || 0) * 100}
              suffix="%"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Детальная статистика */}
        <Col xs={24} lg={12}>
          <Card title="Статистика за последние 24 часа">
            {summary && summary.requests_by_type ? (
              <Table
                columns={requestTypeColumns}
                dataSource={Object.entries(summary.requests_by_type).map(([type, count]) => ({
                  key: type,
                  type,
                  count,
                  success: true,
                }))}
                pagination={false}
                size="small"
              />
            ) : (
              <Text type="secondary">Нет данных за выбранный период</Text>
            )}
            
            <Divider />
            
            <Title level={5}>Ключевые показатели</Title>
            <List
              size="small"
              dataSource={[
                { label: 'Success Rate', value: `${((summary?.success_rate || 0) * 100).toFixed(1)}%` },
                { label: 'Avg Response Time', value: `${(summary?.avg_generation_time_ms || 0).toFixed(2)} ms` },
                { label: 'P95 Response Time', value: `${(summary?.p95_generation_time_ms || 0).toFixed(2)} ms` },
                { label: 'Avg Response Length', value: `${(summary?.avg_response_length || 0).toFixed(0)} chars` },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{item.label}</Text>
                    <Text strong>{item.value}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          <Card title="Недавняя активность" style={{ marginTop: 24 }}>
            <Timeline>
              {recentActivity.map((activity, index) => (
                <Timeline.Item
                  key={index}
                  color={activity.status === 'success' ? 'green' : 'red'}
                  dot={activity.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                >
                  <Space direction="vertical" size={0}>
                    <Text strong>{activity.action}</Text>
                    <Space>
                      <Text type="secondary">
                        <UserOutlined /> {activity.user}
                      </Text>
                      <Text type="secondary">
                        <ClockCircleOutlined /> {activity.time}
                      </Text>
                    </Space>
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* Prometheus метрики и информация об LLM */}
        <Col xs={24} lg={12}>
          <Card title="Информация о LLM">
            <List
              size="small"
              dataSource={[
                { label: 'Провайдер', value: 'Cloud.ru GigaChat' },
                { label: 'Модель', value: metrics?.model || 'ai-sage/GigaChat3-10B-A1.8B' },
                { label: 'Base URL', value: metrics?.base_url || 'https://foundation-models.api.cloud.ru/v1' },
                { label: 'Всего запросов', value: metrics?.total_requests || 0 },
                { label: 'Успешных', value: metrics?.successful || 0 },
                { label: 'Ошибок', value: metrics?.failed || 0 },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong>{item.label}:</Text>
                    <Text>{item.value}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>

          <Card title="Prometheus метрики" style={{ marginTop: 24 }}>
            <pre style={{
              background: '#f6f8fa',
              padding: '16px',
              borderRadius: '6px',
              maxHeight: '300px',
              overflow: 'auto',
              fontSize: '12px',
              margin: 0,
            }}>
              {prometheusMetrics || '# Загрузка метрик...'}
            </pre>
            <Divider />
            <Text type="secondary">
              Метрики в формате Prometheus для интеграции с системами мониторинга
            </Text>
          </Card>

          <Card title="Рекомендации" style={{ marginTop: 24 }}>
            <List
              size="small"
              dataSource={[
                { level: 'info', text: 'Cache hit rate > 80% - отличный показатель' },
                { level: 'warning', text: 'Среднее время генерации < 3000ms - в пределах нормы' },
                { level: 'info', text: 'Success rate > 95% - хорошая стабильность' },
                { level: 'error', text: 'P95 время > 10000ms - требуется оптимизация' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Alert
                    message={item.text}
                    type={item.level}
                    showIcon={false}
                    style={{ width: '100%', padding: '8px 16px' }}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card title="Интерпретация метрик">
        <Row gutter={[24, 24]}>
          <Col span={8}>
            <Space direction="vertical">
              <Title level={5}>Cache Hit Rate</Title>
              <Paragraph type="secondary">
                Показывает эффективность кэширования промптов. Высокий процент снижает затраты и ускоряет генерацию.
              </Paragraph>
              <Progress
                percent={(metrics?.cache_hit_rate || 0) * 100}
                status={(metrics?.cache_hit_rate || 0) > 0.8 ? 'success' : 'normal'}
              />
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical">
              <Title level={5}>Время генерации</Title>
              <Paragraph type="secondary">
                Среднее время ответа от Cloud.ru GigaChat. Влияет на пользовательский опыт.
              </Paragraph>
              <Text strong>
                {metrics?.avg_generation_time_ms ? `${metrics.avg_generation_time_ms.toFixed(2)} ms` : 'Нет данных'}
              </Text>
            </Space>
          </Col>
          <Col span={8}>
            <Space direction="vertical">
              <Title level={5}>Успешность</Title>
              <Paragraph type="secondary">
                Процент успешных запросов к AI-агенту. Показывает стабильность работы системы.
              </Paragraph>
              <Progress
                percent={(summary?.success_rate || 0) * 100}
                status={(summary?.success_rate || 0) > 0.95 ? 'success' : 'normal'}
              />
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Metrics