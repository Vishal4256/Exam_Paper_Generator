import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-9xl font-black text-indigo-600">404</h1>
      <h2 className="text-3xl font-bold text-gray-900 mt-4">Page not found</h2>
      <p className="text-gray-500 mt-2 mb-8">Sorry, we couldn't find the page you're looking for.</p>
      <Link to="/" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
