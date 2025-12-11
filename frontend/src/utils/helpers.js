// Форматирование даты
export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Скачивание файла
export const downloadFile = (content, filename) => {
  const element = document.createElement('a')
  const file = new Blob([content], { type: 'text/plain' })
  element.href = URL.createObjectURL(file)
  element.download = filename
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

// Копирование в буфер обмена
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

// Валидация OpenAPI спецификации
export const validateOpenAPI = (spec) => {
  try {
    if (typeof spec === 'string') {
      const parsed = JSON.parse(spec)
      return parsed.openapi && parsed.info && parsed.paths
    }
    return spec.openapi && spec.info && spec.paths
  } catch {
    return false
  }
}

// Извлечение Python кода из ответа LLM
export const extractPythonCode = (text) => {
  // Убираем markdown блоки кода
  const codeBlockRegex = /```(?:python)?\n?([\s\S]*?)```/gi
  const matches = text.match(codeBlockRegex)
  
  if (matches && matches.length > 0) {
    return matches[0].replace(/```(?:python)?\n?/, '').replace(/```/, '').trim()
  }
  
  return text.trim()
}