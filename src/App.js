import React from 'react';
import InfoDisplayManager from './components/InfoDisplayManager';
import { ThemeProvider } from './components/themes/ThemeProvider';
import './components/themes/theme-effects.css';

function App() {
  return (
    <ThemeProvider>
      <div className="App h-screen w-screen overflow-hidden">
        <InfoDisplayManager />
      </div>
    </ThemeProvider>
  );
}

export default App;
