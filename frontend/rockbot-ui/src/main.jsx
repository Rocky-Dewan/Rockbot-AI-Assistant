import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Root wrapper that reacts to dark mode */}
    <div className="min-h-screen w-full bg-white text-slate-900 dark:bg-[#0b1121] dark:text-slate-100 transition-colors duration-300">
      <App />
    </div>
  </React.StrictMode>,
);
