import React from 'react';
import './App.css'; // You can keep this for global styles or remove it
import HotelBookingsDashboard from './HotelBookingsDashboard'; // Adjust the path if needed

const App: React.FC = () => {
  return (
    <div className="App">
      <HotelBookingsDashboard />
    </div>
  );
};

export default App;
