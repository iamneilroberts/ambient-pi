import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { config } from '../../config/display-config';

// Create theme context
const ThemeContext = createContext();

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Lazy load fonts based on theme
const loadThemeFont = (fontFamily) => {
  switch (fontFamily) {
    case 'VT323':
      import('@fontsource/vt323');
      break;
    case 'Mountains of Christmas':
      import('@fontsource/mountains-of-christmas');
      break;
    case 'Playfair Display':
      import('@fontsource/playfair-display');
      break;
    case 'IM Fell DW Pica':
      import('@fontsource/im-fell-dw-pica');
      break;
    default:
      // System fonts don't need to be loaded
      break;
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = React.useState(config.themes.current);
  const themeConfig = config.themes.available[currentTheme];

  const changeTheme = (themeName) => {
    if (config.themes.available[themeName]) {
      setCurrentTheme(themeName);
      config.themes.current = themeName; // Update config
    }
  };

  // Load theme font when theme changes
  useEffect(() => {
    loadThemeFont(themeConfig.fontFamily);
  }, [themeConfig.fontFamily]);

  useEffect(() => {
    // Apply theme-specific styles to root element
    const root = document.documentElement;
    const colors = themeConfig.colors;

    // Apply colors
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-accent', colors.accent);

    // Apply font family
    root.style.setProperty('--font-family', themeConfig.fontFamily);

    // Apply theme-specific body classes
    document.body.className = `theme-${currentTheme} font-${currentTheme}`;

    // Clean up function
    return () => {
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-background');
      root.style.removeProperty('--color-text');
      root.style.removeProperty('--color-accent');
      root.style.removeProperty('--font-family');
      document.body.className = '';
    };
  }, [currentTheme, themeConfig]);

  // Theme-specific effects components - only render active effects
  const ThemeEffects = useMemo(() => {
    if (!themeConfig.effects) return null;

    // Map of effect names to their component definitions
    const effectComponents = {
      enableScanlines: <div className="scanlines fixed inset-0 pointer-events-none z-50" />,
      enableSnow: <div className="snowfall fixed inset-0 pointer-events-none z-50" />,
      enableMatrixRain: <div className="matrix-rain fixed inset-0 pointer-events-none z-50" />,
      enableGradient: currentTheme === 'sunset' && <div className="gradient" />,
      enableNeon: currentTheme === 'cyberpunk' && <div className="neon" />,
      enableGlitch: currentTheme === 'cyberpunk' && <div className="glitch" />,
      enableBloom: currentTheme === 'sunset' && <div className="bloom" />,
      enableWaves: <div className="ocean-waves" />,
      enableBubbles: <div className="ocean-bubbles" />,
      enableGrid: <div className="synthwave-grid" />,
      enableNeonPulse: currentTheme === 'synthwave' && <div className="neon-pulse" />,
      enableArtDeco: <div className="rounded-lg" />,
      enableGear: <div className="gear fixed top-10 right-10 pointer-events-none z-50" />,
      enableFlames: <div className="flames fixed inset-x-0 bottom-0 pointer-events-none z-50" />,
      enablePalmTrees: <div className="palm-trees fixed inset-x-0 bottom-0 pointer-events-none z-50" />,
      enableConfetti: <div className="confetti fixed inset-0 pointer-events-none z-50" />
    };

    // Only render effects that are enabled for the current theme
    return (
      <>
        {Object.entries(themeConfig.effects || {})
          .filter(([key, enabled]) => enabled)
          .map(([key]) => effectComponents[key])
          .filter(Boolean)}
      </>
    );
  }, [currentTheme, themeConfig.effects]);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeConfig, changeTheme, availableThemes: config.themes.available }}>
      <div className={`theme-${currentTheme} min-h-screen`}>
        {ThemeEffects}
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
