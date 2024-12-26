#!/bin/bash

# Navigate to project directory
cd ~/ambient-pi

# Initialize new React project
echo "Initializing new React project..."
npx create-react-app .

# Initialize Git repository
echo "Initializing Git repository..."
git init
git branch -M main

# Install required dependencies
echo "Installing dependencies..."
npm install \
  lucide-react \
  recharts \
  @headlessui/react \
  tailwindcss \
  postcss \
  autoprefixer

# Initialize Tailwind CSS
echo "Setting up Tailwind CSS..."
npx tailwindcss init -p

# Create project structure
echo "Creating project structure..."
mkdir -p src/components
mkdir -p src/config
mkdir -p docs
mkdir -p docs/images
mkdir -p docs/api
mkdir -p docs/setup

# Create documentation structure
echo "Setting up documentation..."
cat > docs/README.md << 'EOL'
# Project Documentation

## Contents
- [Setup Guide](setup/README.md)
- [API Documentation](api/README.md)
- [Component Documentation](components/README.md)
EOL

# Create setup documentation
cat > docs/setup/README.md << 'EOL'
# Setup Guide

## Prerequisites
- OrangePi 800
- Ubuntu 22.04.5
- Node.js
- Optional: SDR hardware for local transport tracking

## Installation Steps
[Detailed installation steps will go here]

## Configuration
[Configuration steps will go here]
EOL

# Create tailwind.config.js
echo "Configuring Tailwind..."
cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL

# Update src/index.css
echo "Setting up base CSS..."
cat > src/index.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOL

# Create main README.md
echo "Creating README.md..."
cat > README.md << 'EOL'
# Ambient Information Display

A customizable information display system built for the OrangePi 800, featuring:
- Weather dashboard with Gulf Coast specific features
- System monitoring with Pi-hole integration
- Space tracking (ISS, Starlink, launches)
- Transport tracking (aircraft, ships, trains)
- Configurable display rotation with weather-based transitions

## Prerequisites
- OrangePi 800
- Ubuntu 22.04.5
- Node.js
- Optional: SDR hardware for local transport tracking

## Quick Start
```bash
# Clone the repository
git clone [your-repo-url]
cd orangepiAmbient

# Install dependencies
npm install

# Start the development server
npm start
```

## Configuration
1. Copy `src/config/display-config.sample.js` to `src/config/display-config.js`
2. Update the configuration with your API keys and preferences
3. Adjust location settings as needed

## Required API Keys
- OpenWeatherMap
- N2YO (satellite tracking)
- Marine Traffic
- Railroad.earth

## Documentation
See the [docs](docs/) directory for detailed documentation.

## Contributing
Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License
[MIT License](LICENSE)
EOL

# Create CONTRIBUTING.md
echo "Creating CONTRIBUTING.md..."
cat > CONTRIBUTING.md << 'EOL'
# Contributing to Ambient Information Display

We love your input! We want to make contributing as easy and transparent as possible.

## Development Process
1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Coding Style
- Use consistent naming conventions
- Add comments to complex functions
- Follow the existing code style
EOL

# Create LICENSE
echo "Creating LICENSE..."
cat > LICENSE << 'EOL'
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software...
[Rest of MIT license text]
EOL

# Create sample config file
echo "Creating sample config..."
cp src/config/display-config.js src/config/display-config.sample.js

# Create .gitignore
echo "Setting up .gitignore..."
cat > .gitignore << 'EOL'
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

# API Keys and Secrets
src/config/display-config.js
config.secrets.js

# Editor directories and files
.idea
.vscode
*.swp
*.swo
EOL

# Set up auto-start
echo "Setting up auto-start..."
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/ambient-display.desktop << 'EOL'
[Desktop Entry]
Type=Application
Name=Ambient Display
Exec=chromium-browser --kiosk --app=http://localhost:3000
EOL

echo "Setup complete! Next steps:"
echo "1. Update LICENSE with your name"
echo "2. Copy your component files to src/components/"
echo "3. Copy your config file to src/config/"
echo "4. Create a GitHub repository"
echo "5. Run 'npm start' to test the development server"
