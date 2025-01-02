import React from 'react';
import { useTheme } from './ThemeProvider';

export const ThemeFrame = ({ children, className = '' }) => {
  const { currentTheme } = useTheme();

  const getFrameClasses = () => {
    const baseClasses = 'rounded-lg p-4 transition-all duration-300';
    
    // Theme-specific frame classes
    const themeClasses = {
      default: 'bg-opacity-20 bg-gray-800 backdrop-blur-sm',
      retro: 'border-2 border-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)]',
      christmas: 'border-4 border-[var(--color-accent)] shadow-[0_0_15px_rgba(255,215,0,0.3)] bg-white/90',
      cyberpunk: 'border-2 border-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary),0_0_20px_var(--color-accent)] bg-[rgba(0,0,51,0.7)]',
      matrix: 'border-2 border-[var(--color-primary)] shadow-[0_0_15px_var(--color-primary)] bg-[rgba(0,17,0,0.9)]',
      sunset: 'bg-gradient-to-br from-[rgba(255,107,107,0.2)] to-[rgba(225,112,85,0.2)] backdrop-blur-md shadow-lg',
      ocean: 'bg-[rgba(0,40,80,0.4)] backdrop-blur-md shadow-[0_4px_15px_rgba(0,150,255,0.2)]',
      twenties: 'border-4 border-[var(--color-accent)] bg-black/80 shadow-[0_0_15px_var(--color-accent)]',
      steampunk: 'border-8 border-[var(--color-primary)] bg-[rgba(20,10,0,0.9)] shadow-[inset_0_0_20px_rgba(139,69,19,0.5),0_0_15px_var(--color-accent)]',
      ratrod: 'border-4 border-[var(--color-primary)] bg-[rgba(30,30,30,0.9)] shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_0_15px_var(--color-accent)]',
      miami: 'bg-white/10 backdrop-blur-md shadow-[0_0_20px_var(--color-primary),0_0_40px_var(--color-accent)]',
      mardigras: 'border-4 border-[var(--color-accent)] bg-black/80 shadow-[0_0_20px_var(--color-primary)]',
      synthwave: 'border-2 border-[var(--color-primary)] bg-[rgba(38,0,51,0.7)] shadow-[0_0_10px_var(--color-primary),0_0_20px_var(--color-accent)]'
    };

    return `${baseClasses} theme-frame relative ${themeClasses[currentTheme] || themeClasses.default} ${className}`;
  };

  return (
    <div className={getFrameClasses()}>
      {children}
    </div>
  );
};
