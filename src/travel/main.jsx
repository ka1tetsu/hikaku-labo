import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TravelPage from './TravelPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode><TravelPage /></StrictMode>
);
