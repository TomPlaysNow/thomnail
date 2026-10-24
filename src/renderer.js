import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './renderer/App';

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<pre style="color:red;background:#111;padding:20px;white-space:pre-wrap">${e.message}\n\n${e.error?.stack || ''}</pre>`;
});

window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = `<pre style="color:orange;background:#111;padding:20px;white-space:pre-wrap">Unhandled Promise: ${e.reason?.message || e.reason}\n\n${e.reason?.stack || ''}</pre>`;
});

const root = createRoot(document.getElementById('root'));
root.render(<App />);

