import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Components
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Questions from './pages/Questions';
import GenerateExam from './pages/GenerateExam';
import ViewExams from './pages/ViewExams';
import ExamDetail from './pages/ExamDetail';
import Settings from './pages/Settings';
import AIGenerator from './pages/AIGenerator';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <><Navbar /><Home /></>,
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
      path: '/verify-email',
      element: <VerifyEmail />,
    },
    {
      path: '/forgot-password',
      element: <ForgotPassword />,
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