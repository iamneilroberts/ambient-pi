import React from 'react';
import InfoDisplayManager from './components/InfoDisplayManager';
import PhotoFrame from './components/PhotoFrame';

function App() {
  // Get component from URL parameter, e.g., ?component=photos
  const urlParams = new URLSearchParams(window.location.search);
  const component = urlParams.get('component');

  const renderComponent = () => {
    switch (component) {
      case 'photos':
        return <PhotoFrame />;
      default:
        return <InfoDisplayManager />;
    }
  };

  return (
    <div className="App">
      {renderComponent()}
    </div>
  );
}

export default App;
