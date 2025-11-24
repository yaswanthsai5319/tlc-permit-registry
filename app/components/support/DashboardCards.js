// app/components/support/DashboardCards.js
import React, { useState } from "react";
import ExpiringSoonSection from "../sections/ExpiringSoonSection";

export default function DashboardCards() {
    const [showExpiring, setShowExpiring] = useState(false);

    if (showExpiring) {
        return <ExpiringSoonSection onBack={() => setShowExpiring(false)} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
                className="bg-blue-100 p-6 rounded-xl shadow cursor-pointer hover:bg-blue-200 transition"
                onClick={() => setShowExpiring(true)}
            >
                <h3 className="text-lg font-bold text-blue-800 mb-2">Expiring Soon</h3>
                <p className="text-3xl font-bold text-blue-900">12</p>
            </div>
            <div className="bg-yellow-100 p-6 rounded-xl shadow">
                <h3 className="text-lg font-bold text-yellow-800 mb-2">Unpaired Vehicles</h3>
                <p className="text-3xl font-bold text-yellow-900">7</p>
            </div>
            <div className="bg-red-100 p-6 rounded-xl shadow">
                <h3 className="text-lg font-bold text-red-800 mb-2">Orphan Drivers</h3>
                <p className="text-3xl font-bold text-red-900">5</p>
            </div>
        </div>
    );
}
