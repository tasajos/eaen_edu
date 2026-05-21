import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive.css'
import App from './App.jsx'

// Intercepta fetch global para enviar el JWT en todas las peticiones a /api
const _origFetch = window.fetch.bind(window);
window.fetch = function (input, init = {}) {
  try {
    const session = JSON.parse(localStorage.getItem("eaen_session") || "null");
    const token = session?._token;
    const url = typeof input === "string" ? input : input?.url ?? "";
    if (token && url.includes("/api/")) {
      init = { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } };
    }
  } catch { /* sesión corrupta — continúa sin token */ }
  return _origFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
