import React from 'react';
import MapRouter from './components/MapRouter';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100 font-sans text-gray-800">
      <MapRouter />
    </div>
  );
};

export default App;
