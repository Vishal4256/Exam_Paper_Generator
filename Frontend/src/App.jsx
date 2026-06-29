import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Components
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import Footer from './components/Footer';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
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
      element: <><Navbar /><Home /><Footer /></>,
    },
    {
      path: '/pricing',
      element: <><Navbar /><Pricing /><Footer /></>,
    },
    {
      path: '/security',
      element: <><Navbar /><Security /><Footer /></>,
    },
    {
      path: '/privacy-policy',
      element: <><Navbar /><PrivacyPolicy /><Footer /></>,
    },
    {
      path: '/terms',
      element: <><Navbar /><Terms /><Footer /></>,
    },
    {
      path: '/contact',
      element: <><Navbar /><Contact /><Footer /></>,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/register',
      element: <Register />,
    },
    {
      path: '/verify-otp',
      element: <VerifyOTP />,
    },

    {
      path: '/forgot-password',
      element: <ForgotPassword />,
    },
    {
      path: '/reset-password/:token',
      element: <ResetPassword />,
    },
    {
      element: <DashboardLayout />,
      children: [
        {
          path: '/dashboard',
          element: <Dashboard />,
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
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;