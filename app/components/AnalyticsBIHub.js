"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Settings, BarChart2, MapPin } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { storage } from '@/app/utils/storage';

// Fallback demo data in case there are no permits in storage
const DEMO_DRIVER = [
    { date: "2024-06-01", active: 120, duration: 5.2 },
    { date: "2024-06-02", active: 130, duration: 5.5 },
    { date: "2024-06-03", active: 125, duration: 5.1 },
    { date: "2024-06-04", active: 140, duration: 6.0 },
];
const DEMO_VEHICLE = [
    { lease: "12m", count: 40 },
    { lease: "24m", count: 60 },
    { lease: "36m", count: 30 },
];
const DEMO_IDLE = [
    { date: "2024-06-01", idle: 10 },
    { date: "2024-06-02", idle: 12 },
    { date: "2024-06-03", idle: 8 },
    { date: "2024-06-04", idle: 15 },
];
const DEMO_BOROUGH = [
    { borough: "Manhattan", utilization: 80 },
    { borough: "Brooklyn", utilization: 65 },
    { borough: "Queens", utilization: 50 },
    { borough: "Bronx", utilization: 40 },
    { borough: "Staten Island", utilization: 20 },
];

export default function AnalyticsBIHub() {
    const [filterDate, setFilterDate] = useState("");
    const [filterBorough, setFilterBorough] = useState("");
    const [permits, setPermits] = useState([]);

    useEffect(() => {
        const stored = storage.get('permits') || [];
        setPermits(stored);
    }, []);

    // Derived data for charts
    const driverData = useMemo(() => {
        if (!permits || permits.length === 0) return DEMO_DRIVER;
        const byDate = {};
        permits.forEach(p => {
            const d = p.submittedAt ? new Date(p.submittedAt).toISOString().split('T')[0] : null;
            if (!d) return;
            if (!byDate[d]) byDate[d] = { date: d, active: 0, duration: 0, count: 0 };
            byDate[d].active += 1;
            // estimate duration as schedule length hours if available
            const dur = Array.isArray(p.schedule) ? p.schedule.length / 8 : 0;
            byDate[d].duration += dur;
            byDate[d].count += (dur > 0 ? 1 : 0);
        });
        return Object.values(byDate).map(val => ({ date: val.date, active: val.active, duration: val.count ? +(val.duration / val.count).toFixed(1) : 0 }));
    }, [permits]);

    const vehicleData = useMemo(() => {
        if (!permits || permits.length === 0) return DEMO_VEHICLE;
        // bucket vehicles by age (approx years since vehicleYear)
        const now = new Date().getFullYear();
        const buckets = { '<=2016': 0, '2017-2019': 0, '2020+': 0 };
        permits.forEach(p => {
            const y = Number(p.vehicleYear) || 0;
            if (!y) return;
            if (y <= 2016) buckets['<=2016']++;
            else if (y <= 2019) buckets['2017-2019']++;
            else buckets['2020+']++;
        });
        return Object.entries(buckets).map(([lease, count]) => ({ lease, count }));
    }, [permits]);

    const idleFleet = useMemo(() => {
        if (!permits || permits.length === 0) return DEMO_IDLE;
        const byDate = {};
        permits.forEach(p => {
            const d = p.submittedAt ? new Date(p.submittedAt).toISOString().split('T')[0] : null;
            if (!d) return;
            if (!byDate[d]) byDate[d] = { date: d, idle: 0 };
            if (p.status && p.status.toLowerCase() !== 'approved') byDate[d].idle += 1;
        });
        return Object.values(byDate);
    }, [permits]);

    const boroughUtilization = useMemo(() => {
        if (!permits || permits.length === 0) return DEMO_BOROUGH;
        const map = {};
        permits.forEach(p => {
            const b = p.borough || 'Unknown';
            if (!map[b]) map[b] = { borough: b, total: 0, approved: 0 };
            map[b].total += 1;
            if (p.status && p.status.toLowerCase().includes('approved')) map[b].approved += 1;
        });
        return Object.values(map).map(m => ({ borough: m.borough, utilization: Math.round((m.approved / m.total) * 100) }));
    }, [permits]);

    // Apply client-side filtering selectors
    const visibleDriverData = useMemo(() => {
        return driverData.filter(d => {
            if (filterDate && d.date !== filterDate) return false;
            return true;
        });
    }, [driverData, filterDate]);

    const visibleIdleFleet = useMemo(() => {
        return idleFleet.filter(d => {
            if (filterDate && d.date !== filterDate) return false;
            return true;
        });
    }, [idleFleet, filterDate]);

    const visibleBoroughs = useMemo(() => {
        if (!filterBorough) return boroughUtilization;
        return boroughUtilization.filter(b => b.borough === filterBorough);
    }, [boroughUtilization, filterBorough]);

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">

            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-end">
                    <span className="font-bold text-indigo-900">Analytics & BI Hub</span>
                </nav>
                {/* HEADER */}
                <header className="bg-white shadow flex items-center gap-4 px-8 py-6">
                    <BarChart2 className="w-8 h-8 text-indigo-800" />
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
                                <div className="font-semibold mb-2 text-indigo-800">Active Drivers</div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={visibleDriverData.length ? visibleDriverData : DEMO_DRIVER}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="active" stroke="#3730A3" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <div className="font-semibold mb-2 text-indigo-800">Pairing Duration Trends</div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={visibleDriverData.length ? visibleDriverData : DEMO_DRIVER}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="duration" stroke="#4F46E5" strokeWidth={2} />
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
                                <div className="font-semibold mb-2 text-indigo-800">Vehicle Lease Lengths</div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={vehicleData}>
                                        <XAxis dataKey="lease" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#059669" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <div className="font-semibold mb-2 text-indigo-800">Fleet Idle Status</div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <LineChart data={visibleIdleFleet.length ? visibleIdleFleet : DEMO_IDLE}>
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="idle" stroke="#f59e0b" strokeWidth={2} />
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
                        <div className="font-semibold mb-2 text-indigo-800">Borough Utilization</div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {visibleBoroughs.map(b => (
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
