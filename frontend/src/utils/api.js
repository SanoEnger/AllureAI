import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data)
      
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      
      return Promise.reject(error.response.data)
    } else if (error.request) {
      console.error('Network Error:', error.request)
      return Promise.reject({ message: 'Network error. Please check your connection.' })
    } else {
      console.error('Error:', error.message)
      return Promise.reject({ message: error.message })
    }
  }
)

export const testService = {
  generateTestCase: (data) => api.post('/generate/testcase', data),
  generateAutotest: (data) => api.post('/generate/autotest', data),
  validateTestCase: (code) => api.post('/validate/testcase', { code }),
  getMetrics: () => api.get('/metrics'),
  getMetricsSummary: (hours = 24) => api.get(`/metrics/summary?hours=${hours}`),
  getPrometheusMetrics: () => api.get('/metrics/prometheus'),
  healthCheck: () => api.get('/health'),
}

export default api