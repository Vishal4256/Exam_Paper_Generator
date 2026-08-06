import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Components
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Questions from './pages/Questions';
import GenerateExam from './pages/GenerateExam';
import ViewExams from './pages/ViewExams';
import ExamDetail from './pages/ExamDetail';
import Settings from './pages/Settings';
import AIGenerator from './pages/AIGenerator';
import AIImport from './pages/AIImport';
import HistoryDashboard from './pages/HistoryDashboard';
import Pricing from './pages/Pricing';
import Security from './pages/Security';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <ErrorBoundary><Navbar /><Home /><Footer /></ErrorBoundary>,
    },
    {
      path: '/pricing',
      element: <ErrorBoundary><Navbar /><Pricing /><Footer /></ErrorBoundary>,
    },
    {
      path: '/security',
      element: <ErrorBoundary><Navbar /><Security /><Footer /></ErrorBoundary>,
    },
    {
      path: '/privacy-policy',
      element: <ErrorBoundary><Navbar /><PrivacyPolicy /><Footer /></ErrorBoundary>,
    },
    {
      path: '/terms',
      element: <ErrorBoundary><Navbar /><Terms /><Footer /></ErrorBoundary>,
    },
    {
      path: '/contact',
      element: <ErrorBoundary><Navbar /><Contact /><Footer /></ErrorBoundary>,
    },
    {
      path: '/login',
      element: <ErrorBoundary><Login /></ErrorBoundary>,
    },
    {
      path: '/register',
      element: <ErrorBoundary><Register /></ErrorBoundary>,
    },
    {
      path: '/forgot-password',
      element: <ErrorBoundary><ForgotPassword /></ErrorBoundary>,
    },
    {
      path: '/reset-password/:token',
      element: <ErrorBoundary><ResetPassword /></ErrorBoundary>,
    },
    {
      element: <ErrorBoundary><DashboardLayout /></ErrorBoundary>,
      children: [
        {
          path: '/dashboard',
          element: <Dashboard />,
        },
        {
          path: '/analytics',
          element: <Analytics />,
        },
        {
          path: '/questions',
          element: <Questions />,
        },
        {
          path: '/generate',
          element: <GenerateExam />,
        },
        {
          path: '/ai-generator',
          element: <AIGenerator />,
        },
        {
          path: '/ai-import',
          element: <AIImport />,
        },
        {
          path: '/history',
          element: <HistoryDashboard />,
        },
        {
          path: '/exams',
          element: <ViewExams />,
        },
        {
          path: '/exams/:id',
          element: <ExamDetail />,
        },
        {
          path: '/settings',
          element: <Settings />,
        }
      ]
    },
    {
      path: '*',
      element: <><Navbar /><NotFound /><Footer /></>,
    }
  ])
  return (
    <AuthProvider>
      <NotificationsProvider>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        <RouterProvider router={router} />
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;