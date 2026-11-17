import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './styles/tokens.css';
import './styles/desk.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
