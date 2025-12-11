import React from 'react'
import { Card, Button, Space, message } from 'antd'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import { copyToClipboard, downloadFile } from '../../utils/helpers'

const CodeDisplay = ({ code, language = 'python', title = 'Сгенерированный код' }) => {
  const handleCopy = async () => {
    const success = await copyToClipboard(code)
    if (success) {
      message.success('Код скопирован в буфер обмена')
    } else {
      message.error('Не удалось скопировать код')
    }
  }

  const handleDownload = () => {
    downloadFile(code, `test_${Date.now()}.py`)
    message.success('Файл успешно скачан')
  }

  return (
    <Card
      title={title}
      extra={
        <Space>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            Копировать
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownload} type="primary">
            Скачать
          </Button>
        </Space>
      }
      style={{ marginTop: 16 }}
    >
      <div style={{ maxHeight: '600px', overflow: 'auto' }}>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{ margin: 0, borderRadius: '8px' }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </Card>
  )
}

export default CodeDisplay