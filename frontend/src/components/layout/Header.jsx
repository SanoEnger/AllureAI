import React from 'react'
import { Layout, Space, Button, Badge, Dropdown } from 'antd'
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'

const { Header } = Layout

const HeaderComponent = () => {
  const items = [
    {
      key: '1',
      label: 'Профиль',
    },
    {
      key: '2',
      label: 'Настройки',
    },
    {
      key: '3',
      label: 'Выйти',
    },
  ]

  return (
    <Header style={{ 
      background: '#fff', 
      padding: '0 24px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 1,
      position: 'sticky',
      top: 0,
      // УБРАЛ marginLeft отсюда
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#001529' }}>
          AI Агент генерации тестов
        </h2>
      </div>
      <Space size="middle">
        <Button type="text" icon={<QuestionCircleOutlined />} size="large">
          Помощь
        </Button>
        <Badge count={3} size="small">
          <Button type="text" icon={<BellOutlined />} size="large" />
        </Badge>
        <Dropdown menu={{ items }} placement="bottomRight">
          <Button type="text" icon={<UserOutlined />} size="large">
            Admin
          </Button>
        </Dropdown>
        <Button type="text" icon={<SettingOutlined />} size="large" />
      </Space>
    </Header>
  )
}

export default HeaderComponent