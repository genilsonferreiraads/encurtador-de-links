import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { SidebarProvider } from './contexts/SidebarContext';

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