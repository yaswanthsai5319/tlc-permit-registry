// app/page.js
'use client';

import { useState, useEffect } from 'react';
import { User, Shield } from 'lucide-react';
import { initializeData, storage } from './utils/storage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import TLCAdminDashboard from './components/TLCAdminDashboard';
import VehicleOwnerHome from './components/VehicleOwnerHome';
import FleetOwnerHome from './components/FleetOwnerHome';

const USER_TYPES = [
    { value: '', label: 'Select User Type' },
    { value: 'admin', label: 'Registry Admin' },
    { value: 'carrier', label: 'Carrier Ops Manager' },
    { value: 'owner', label: 'Vehicle Owner' },
    { value: 'fleet', label: 'Fleet Owner' },
    { value: 'public', label: 'Public/Verifier' },
    { value: 'tlc', label: 'TLC Super Admin' }
];

export default function Home() {
    const [userType, setUserType] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        initializeData();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        // TLC login check (hardcoded)
        if (userType === 'tlc' && username === 'tlc' && password === 'tlc123') {
            setCurrentUser({ username: 'tlc', role: 'tlc' });
            setIsLoggedIn(true);
            setError('');
            return;
        }

        // Admin login check (hardcoded)
        if (userType === 'admin' && username === 'admin' && password === 'admin123') {
            setCurrentUser({ username: 'admin', role: 'admin' });
            setIsLoggedIn(true);
            setError('');
            return;
        }

        // Owner login check (hardcoded)
        if (userType === 'owner' && username === 'owner' && password === 'owner123') {
            setCurrentUser({ username: 'owner', role: 'owner' });
            setIsLoggedIn(true);
            setError('');
            return;
        }

        // Fleet login check (hardcoded)
        if (userType === 'fleet' && username === 'fleet' && password === 'fleet123') {
            setCurrentUser({ username: 'fleet', role: 'fleet' });
            setIsLoggedIn(true);
            setError('');
            return;
        }

        // Get users from localStorage
        const users = storage.get('users') || [];
        const user = users.find(u => u.username === username && u.password === password && u.role === userType);

        if (user) {
            setCurrentUser(user);
            setIsLoggedIn(true);
            setError('');
        } else {
            setError('Invalid credentials or wrong user type');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setUserType('');
        setUsername('');
        setPassword('');
        setError('');
    };

    // Dashboard routing
    if (isLoggedIn && currentUser) {
        switch (currentUser.role) {
            case 'admin':
                return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
            case 'owner':
                return <VehicleOwnerHome user={currentUser} onLogout={handleLogout} />;
            case 'fleet':
                return <FleetOwnerHome user={currentUser} onLogout={handleLogout} />;
            case 'carrier':
            case 'compliance':
            case 'marketplace':
            case 'public':
                return <UserDashboard user={currentUser} onLogout={handleLogout} />;
            case 'tlc':
                return <TLCAdminDashboard user={currentUser} onLogout={handleLogout} />;
            default:
                return <UserDashboard user={currentUser} onLogout={handleLogout} />;
        }
    }

    // Login form with dropdown
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800">TLC Permit Registry Login</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                        <select
                            value={userType}
                            onChange={e => setUserType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                            required
                        >
                            {USER_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
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
