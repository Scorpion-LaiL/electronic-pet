import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { isDesktopShell } from './desktop/window/window-bridge';
import './styles/tokens.css';
import './styles/globals.css';

if (isDesktopShell()) {
  document.body.classList.add('body--desktop-shell');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
