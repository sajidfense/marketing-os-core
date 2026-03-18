import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrgProvider } from '@/contexts/OrgContext';
import { CreditsProvider } from '@/contexts/CreditsContext';
import App from '@/app/App';
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <CreditsProvider>
            <App />
            <Toaster position="top-right" richColors theme="dark" />
          </CreditsProvider>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
