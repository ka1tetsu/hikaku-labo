import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ComparePage from './ComparePage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode><ComparePage /></StrictMode>
);
