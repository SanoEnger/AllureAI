import React from 'react'
import { Spin, Space, Typography } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const { Text } = Typography

const LoadingSpinner = ({ message = 'Загрузка...', size = 'large' }) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '300px',
      padding: '40px'
    }}>
      <Space direction="vertical" size="large" align="center">
        <Spin indicator={antIcon} size={size} />
        <Text type="secondary">{message}</Text>
      </Space>
    </div>
  )
}

export default LoadingSpinner