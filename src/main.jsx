import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from './context/AppContext'
import App from './App'
import { aplicarPreferenciasAyres } from './lib/visualPreferences'
import './index.css'
import './styles/ayres-design-system.css'
import './styles/ayres-unified.css'

aplicarPreferenciasAyres()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
)
