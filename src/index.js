import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';  // This imports the Tailwind directives
import App from './App';
// import App from './TestPage';
// import App from './components/SpaceTracker';
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <div className="min-h-screen bg-gray-900 text-white">
      <App />
    </div>
  </React.StrictMode>
);
