'use client';

import { useState, useEffect } from 'react';
import { User, Shield } from 'lucide-react';
import { initializeData, storage } from './utils/storage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function Home() {
  const [loginType, setLoginType] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize data on component mount
  useEffect(() => {
    initializeData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get users from localStorage
    const users = storage.get('users') || [];
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user && ((loginType === 'user' && user.role === 'user') || (loginType === 'admin' && user.role === 'admin'))) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Invalid credentials or wrong login type');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginType(null);
    setUsername('');
    setPassword('');
    setError('');
  };

  // If logged in, show appropriate dashboard
  if (isLoggedIn && currentUser) {
    if (currentUser.role === 'user') {
      return <UserDashboard user={currentUser} onLogout={handleLogout} />;
    } else if (currentUser.role === 'admin') {
      return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
    }
  }

  // Show role selection page
  if (!loginType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">TLC Permit Registry</h1>
            <p className="text-xl text-gray-600">Select your login type to continue</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setLoginType('user')}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">User Login</h2>
              <p className="text-gray-600">For drivers and fleet owners to submit permit requests</p>
            </button>
            
            <button
              onClick={() => setLoginType('admin')}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Login</h2>
              <p className="text-gray-600">For TLC administrators to manage permits and view analytics</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <button
          onClick={() => {
            setLoginType(null);
            setError('');
          }}
          className="text-blue-600 mb-4 hover:underline"
        >
          ← Back
        </button>
        
        <div className="text-center mb-8">
          {loginType === 'user' ? (
            <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          ) : (
            <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          )}
          <h2 className="text-3xl font-bold text-gray-800">
            {loginType === 'user' ? 'User Login' : 'Admin Login'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}