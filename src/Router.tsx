import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import RedirectPage from './pages/RedirectPage';
import DashboardPage from './pages/DashboardPage';
import CreateLinkPage from './pages/CreateLinkPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import UsersManagementPage from './pages/UsersManagementPage';
import Layout from './components/Layout';
import NotFoundPage from './pages/NotFoundPage';
import ExpiredLinkPage from './pages/ExpiredLinkPage';
import BioLinksPage from './pages/BioLinksPage';
import PublicBioPage from './pages/PublicBioPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export function Router() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/criar-link" element={<CreateLinkPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/usuarios" element={<UsersManagementPage />} />
          <Route path="/bio-links" element={<BioLinksPage />} />
        </Route>
        <Route path="/expired" element={<ExpiredLinkPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/:slug" element={<RedirectPage />} />
        <Route path="/bio/:userId" element={<PublicBioPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
} 