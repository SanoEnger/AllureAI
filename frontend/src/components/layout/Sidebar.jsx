import React, { useState } from 'react'
import { Layout, Menu } from 'antd'
import {
  CodeOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  DashboardOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider } = Layout

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/testcase-generator',
      icon: <CodeOutlined />,
      label: 'Генератор тест-кейсов',
    },
    {
      key: '/openapi-generator',
      icon: <ApiOutlined />,
      label: 'OpenAPI генератор',
    },
    {
      key: '/demos',
      icon: <RocketOutlined />,
      label: 'Демо-примеры',
    },
    {
      key: '/metrics',
      icon: <DashboardOutlined />,
      label: 'Метрики',
    },
  ]

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <div style={{ height: 64, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!collapsed ? (
          <h2 style={{ color: '#1890ff', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            DevTuls AI Agent
          </h2>
        ) : (
          <CodeOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  )
}

export default Sidebar