import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import TestCaseGenerator from './pages/TestCaseGenerator'
import OpenAPIGenerator from './pages/OpenAPIGenerator'
import Demos from './pages/Demos'
import Metrics from './pages/Metrics'

const { Content } = Layout

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar />
        <Layout style={{ marginLeft: 250, minHeight: '100vh' }}>
          <Header />
          <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
            <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
              <Routes>
                <Route path="/testcase-generator" element={<TestCaseGenerator />} />
                <Route path="/openapi-generator" element={<OpenAPIGenerator />} />
                <Route path="/demos" element={<Demos />} />
                <Route path="/metrics" element={<Metrics />} />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </Router>
  )
}

export default App