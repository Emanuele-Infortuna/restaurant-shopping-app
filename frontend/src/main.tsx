import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Configurazione globale per l'app
const isDevelopment = import.meta.env.DEV;

// Error boundary per gestire errori globali durante lo sviluppo
if (isDevelopment) {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
  
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
}

// Verifica che l'elemento root esista
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure there is an element with id="root" in your HTML.'
  );
}

// Crea e monta l'app React
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Hot module replacement per lo sviluppo
if (isDevelopment && import.meta.hot) {
  import.meta.hot.accept('./App.tsx', () => {
    console.log('Hot reload: App component updated');
  });
}