import React, { useState } from 'react'
import { Upload, Button, message, Space, Typography } from 'antd'
import { UploadOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons'

const { Text } = Typography

const FileUploader = ({ onFileLoaded, accept = '.json,.yaml,.yml', maxSizeMB = 10 }) => {
  const [file, setFile] = useState(null)

  const beforeUpload = (file) => {
    const isAcceptable = accept.split(',').some(ext => file.name.toLowerCase().endsWith(ext.replace('.', '')))
    if (!isAcceptable) {
      message.error(`Можно загружать только файлы ${accept}`)
      return false
    }

    const isLtSize = file.size / 1024 / 1024 < maxSizeMB
    if (!isLtSize) {
      message.error(`Файл должен быть меньше ${maxSizeMB}MB`)
      return false
    }

    return true
  }

  const handleChange = (info) => {
    const { file } = info
    
    if (file.status === 'done') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target.result
          onFileLoaded(content, file.name)
          setFile(file)
          message.success(`${file.name} успешно загружен`)
        } catch (error) {
          message.error('Ошибка чтения файла')
        }
      }
      reader.readAsText(file.originFileObj)
    } else if (file.status === 'error') {
      message.error(`${file.name} не удалось загрузить`)
    }
  }

  const handleRemove = () => {
    setFile(null)
    onFileLoaded('', '')
  }

  return (
    <div>
      {!file ? (
        <Upload
          name="file"
          accept={accept}
          showUploadList={false}
          beforeUpload={beforeUpload}
          onChange={handleChange}
          customRequest={({ onSuccess }) => setTimeout(() => onSuccess('ok'), 0)}
        >
          <Button icon={<UploadOutlined />} size="large" style={{ width: '100%' }}>
            Выберите файл OpenAPI
          </Button>
        </Upload>
      ) : (
        <Space style={{ 
          width: '100%', 
          padding: '12px', 
          border: '1px solid #d9d9d9', 
          borderRadius: '6px',
          background: '#fafafa'
        }}>
          <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <div style={{ flex: 1 }}>
            <Text strong style={{ display: 'block' }}>{file.name}</Text>
            <Text type="secondary">
              {(file.size / 1024).toFixed(2)} KB
            </Text>
          </div>
          <Button 
            icon={<DeleteOutlined />} 
            type="text" 
            danger 
            onClick={handleRemove}
          />
        </Space>
      )}
      <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
        Поддерживаемые форматы: JSON, YAML (макс. {maxSizeMB}MB)
      </Text>
    </div>
  )
}

export default FileUploader