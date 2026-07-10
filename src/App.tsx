import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import ProfilePage from './pages/dashboard/ProfilePage';
import DietPage from './pages/dashboard/DietPage';
import ExercisePage from './pages/dashboard/ExercisePage';
import ProgressPage from './pages/dashboard/ProgressPage';
import SchedulePage from './pages/dashboard/SchedulePage';
import SettingsPage from './pages/dashboard/SettingsPage';

const CoachPage = lazy(() => import('./pages/dashboard/CoachPage'));
const LearnPage = lazy(() => import('./pages/dashboard/LearnPage'));
const DevicesPage = lazy(() => import('./pages/dashboard/DevicesPage'));

const LazyFallback = (
  <div className="flex h-64 items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary-500"></div>
  </div>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#232336',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#34D399',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF6584',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="diet" element={<DietPage />} />
            <Route path="exercise" element={<ExercisePage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route
              path="coach"
              element={<Suspense fallback={LazyFallback}><CoachPage /></Suspense>}
            />
            <Route
              path="learn"
              element={<Suspense fallback={LazyFallback}><LearnPage /></Suspense>}
            />
            <Route
              path="devices"
              element={<Suspense fallback={LazyFallback}><DevicesPage /></Suspense>}
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
