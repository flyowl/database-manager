import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress benign ResizeObserver errors commonly caused by layout engines (ReactFlow, CodeMirror)
// when handling complex flex/grid resizing.
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && /ResizeObserver loop/.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
};

window.addEventListener('error', (event) => {
  if (event.message === 'ResizeObserver loop completed with undelivered notifications.' || 
      event.message === 'ResizeObserver loop limit exceeded') {
    event.stopImmediatePropagation();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);