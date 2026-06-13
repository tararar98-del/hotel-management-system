import React from 'react'
import ReactDOM from 'react-dom/client' // บรรทัดนี้สำคัญที่สุด
import App from './App'
import './index.css' // ถ้ามี

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)