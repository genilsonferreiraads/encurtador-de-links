import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { SidebarProvider } from './contexts/SidebarContext';
import ExpiredLinkPage from './pages/ExpiredLinkPage';

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Router />
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App; 