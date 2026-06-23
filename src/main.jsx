import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from './context/AppContext'
import App from './App'
import './index.css'
import './styles/ayres-global-polish.css'
import './styles/ayres-design-system.css'
import './styles/ayres-tema.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
)
