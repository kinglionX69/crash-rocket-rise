
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");

// Make sure the root element exists before rendering
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);
