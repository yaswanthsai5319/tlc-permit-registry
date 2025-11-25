import React from "react";

export default function Sidebar() {
    return (
        <aside className="w-64 bg-blue-900 text-white min-h-screen p-6">
            <nav>
                <ul className="space-y-4">
                    <li><a href="#" className="hover:underline">Dashboard</a></li>
                    <li><a href="#" className="hover:underline">Analytics</a></li>
                    <li><a href="#" className="hover:underline">Pairings</a></li>
                    <li><a href="#" className="hover:underline">Search</a></li>
                    <li><a href="#" className="hover:underline">Verify</a></li>
                </ul>
            </nav>
        </aside>
    );
}
