import React, { useState } from "react";
import { Settings, BarChart2, MapPin } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// Demo data
const driverData = [
    { date: "2024-06-01", active: 120, duration: 5.2 },
    { date: "2024-06-02", active: 130, duration: 5.5 },
    { date: "2024-06-03", active: 125, duration: 5.1 },
    { date: "2024-06-04", active: 140, duration: 6.0 },
];
const vehicleData = [
    { lease: "12m", count: 40 },
    { lease: "24m", count: 60 },
    { lease: "36m", count: 30 },
];
const idleFleet = [
    { date: "2024-06-01", idle: 10 },
    { date: "2024-06-02", idle: 12 },
    { date: "2024-06-03", idle: 8 },
    { date: "2024-06-04", idle: 15 },
];
const boroughUtilization = [
    { borough: "Manhattan", utilization: 80 },
    { borough: "Brooklyn", utilization: 65 },
    { borough: "Queens", utilization: 50 },
    { borough: "Bronx", utilization: 40 },
    { borough: "Staten Island", utilization: 20 },
];

export default function AnalyticsBIHub() {
    const [filterDate, setFilterDate] = useState("");
    const [filterBorough, setFilterBorough] = useState("");

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">

            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-end">
                    <span className="font-bold text-blue-700">Analytics & BI Hub</span>
                </nav>
                {/* HEADER */}
                <header className="bg-white shadow flex items-center gap-4 px-8 py-6">
                    <BarChart2 className="w-8 h-8 text-indigo-600" />
                    <div className="text-xl font-bold">Analytics Dashboard</div>
                </header>
                {/* Filters */}
                <div className="flex gap-4 px-8 py-2">
                    <input
                        type="date"
                        className="border rounded px-2 py-1"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />
                    <select
                        className="border rounded px-2 py-1"
                        value={filterBorough}
                        onChange={e => setFilterBorough(e.target.value)}
                    >
                        <option value="">All Boroughs</option>
                        {boroughUtilization.map(b => (
                            <option key={b.borough} value={b.borough}>{b.borough}</option>
                        ))}
                    </select>
                </div>
                <main className="flex-1 p-8 space-y-8">
                    {/* DRIVER UTILIZATION */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart2 className="w-6 h-6 text-blue-500" />
                            <span className="font-bold text-lg">Driver Utilization</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <div className="font-semibold mb-2">Active Drivers</div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={driverData}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <div className="font-semibold mb-2">Pairing Duration Trends</div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={driverData}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="duration" stroke="#6366f1" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    {/* VEHICLE UTILIZATION */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart2 className="w-6 h-6 text-green-500" />
                            <span className="font-bold text-lg">Vehicle Utilization</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <div className="font-semibold mb-2">Vehicle Lease Lengths</div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={vehicleData}>
                                        <XAxis dataKey="lease" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <div className="font-semibold mb-2">Fleet Idle Status</div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={idleFleet}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="idle" stroke="#f59e42" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    {/* HEATMAPS */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-6 h-6 text-indigo-500" />
                            <span className="font-bold text-lg">Heatmaps</span>
                        </div>
                        <div className="font-semibold mb-2">Borough Utilization</div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {boroughUtilization.map(b => (
                                <div key={b.borough} className="flex flex-col items-center">
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold"
                                        style={{
                                            background: `linear-gradient(135deg, #6366f1 ${b.utilization}%, #e0e7ff 100%)`
                                        }}
                                        title={`${b.utilization}%`}
                                    >
                                        {b.utilization}%
                                    </div>
                                    <div className="mt-2 text-xs text-gray-700">{b.borough}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 text-gray-500 text-sm">
                            {/* Placeholder for geospatial map */}
                            <div className="border rounded-lg p-8 flex items-center justify-center bg-blue-50">
                                <span className="text-2xl text-indigo-400">🗺️ NYC Borough Map (Heatmap)</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
