import React from "react";

export default function Navbar({ user, onLogout }) {
    return (
        <nav className="flex items-center justify-between bg-white px-6 py-3 shadow">
            <span className="font-bold text-lg text-blue-700">TLC Permit Registry</span>
            <div>
                {user && <span className="mr-4 text-gray-700">Logged in as: {user.username}</span>}
                <button onClick={onLogout} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                    Logout
                </button>
            </div>
        </nav>
    );
}
