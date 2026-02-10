import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { I18nProvider } from './i18n.js';
import './index.css';

/**
 * Main entry point for the Task Management App.
 * This file initializes the React root and renders the App component.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
