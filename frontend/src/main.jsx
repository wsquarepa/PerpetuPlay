import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ConnectionProvider } from "./context/ConnectionContext";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConnectionProvider>
        <App />
    </ConnectionProvider>
  </StrictMode>,
)
