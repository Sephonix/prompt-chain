import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './styles/index.css';

// Create the root element for React
const container = document.getElementById('root');
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 