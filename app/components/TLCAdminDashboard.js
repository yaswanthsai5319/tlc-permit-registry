"use client";
import React, { useState, useEffect, useMemo } from "react";
import { storage } from '@/app/utils/storage';
import { Bell, Search, Grid, AlertCircle, Clock, FileText, Settings, BarChart2, Globe } from "lucide-react";
import SearchPermit from "./SearchPermit";
import EntityDetail from "./EntityDetail";
import PairingWizard from "./PairingWizard";
import AdminConfiguration from "@/app/components/AdminConfiguration";
import AnalyticsBIHub from "@/app/components/AnalyticsBIHub";
import PublicVerification from "@/app/components/PublicVerification";

const sidebarOptions = [
    { label: "Dashboard", icon: <Grid className="w-5 h-5 mr-2" /> },
    { label: "Search Permits", icon: <Search className="w-5 h-5 mr-2" /> },
    { label: "Pairing Wizard", icon: <Clock className="w-5 h-5 mr-2" /> },
    { label: "Entity Details", icon: <FileText className="w-5 h-5 mr-2" /> },
    { label: "Admin Configuration", icon: <Settings className="w-5 h-5 mr-2" /> },
    { label: "Analytics & BI Hub", icon: <BarChart2 className="w-5 h-5 mr-2" /> },
    { label: "Public Verification", icon: <Globe className="w-5 h-5 mr-2" /> },
];

// TLCAdminDashboard now reads dynamic permit data from localStorage (via storage)

export default function TLCAdminDashboard({ user, onLogout }) {
    const [activeSidebar, setActiveSidebar] = useState("Dashboard");
    const [permits, setPermits] = useState([]);

    useEffect(() => {
        const stored = storage.get('permits') || [];
        setPermits(stored);
    }, []);

    // Derived lists
    const expiringPermits = useMemo(() => {
        const list = [];
        const now = new Date();
        const withinDays = (dateStr, days = 30) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            const diffDays = (d - now) / (1000 * 60 * 60 * 24);
            return diffDays <= days && diffDays >= -3650; // allow dates in the past (EXPIRED) as well
        };

        permits.forEach(p => {
            // pick an expiry date to show: licenseExpiry > insuranceExpiry > last schedule date
            let expiry = p.licenseExpiry || p.insuranceExpiry || '';
            if ((!expiry || expiry === '') && Array.isArray(p.schedule) && p.schedule.length > 0) {
                expiry = p.schedule[p.schedule.length - 1].date;
            }

            if (expiry) {
                list.push({
                    id: p.id,
                    driver: p.driverName,
                    vehicle: p.vehiclePlate,
                    status: p.status || 'N/A',
                    expiry: expiry
                });
            }
        });

        // sort by soonest expiry and return a top slice
        list.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
        return list.slice(0, 6);
    }, [permits]);

    const suspendedPermits = useMemo(() => {
        return permits.filter(p => p.driverSuspended || (p.status && (p.status.toLowerCase() === 'suspended' || p.status.toLowerCase() === 'revoked')))
            .map(p => ({ id: p.id, driver: p.driverName, vehicle: p.vehiclePlate, status: p.status, expiry: p.licenseExpiry }));
    }, [permits]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
            {/* NAVBAR */}
            <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button className="text-indigo-900 font-bold text-lg">☰ App Switcher</button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-indigo-500"
                        />
                        <Search className="absolute right-2 top-2 w-5 h-5 text-gray-400" />
                    </div>
                    <button className="relative">
                        <Bell className="w-6 h-6 text-indigo-900" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                    </button>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 text-sm text-white bg-gradient-to-r from-indigo-700 to-emerald-500 hover:from-indigo-800 hover:to-emerald-600 rounded-lg shadow transition-colors font-semibold"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="flex flex-1">
                {/* SIDEBAR */}
                <aside className="w-64 bg-white border-r shadow-lg flex flex-col py-6 px-4">
                    <nav className="space-y-2">
                        {sidebarOptions.map(opt => (
                            <button
                                key={opt.label}
                                onClick={() => setActiveSidebar(opt.label)}
                                className={`flex items-center w-full px-4 py-2 rounded-lg font-semibold transition ${activeSidebar === opt.label
                                    ? "bg-indigo-100 text-indigo-900"
                                    : "text-gray-700 hover:bg-indigo-50"
                                    }`}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-8 bg-gradient-to-br from-white via-blue-50 to-indigo-100">
                    {activeSidebar === "Dashboard" && (
                        <>
                            <h1 className="text-2xl font-extrabold text-indigo-900 mb-6">Permit Registry Dashboard</h1>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                {/* Expiring Soon Card */}
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-lg border-l-4 border-yellow-400">
                                    <h2 className="text-lg font-bold text-yellow-800 mb-2 flex items-center gap-2"><svg className="w-5 h-5 text-yellow-800" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 8v4l3 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>Expiring Soon</h2>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-black">
                                                <th className="text-left py-1">Driver / Vehicle</th>
                                                <th className="text-left py-1">Status</th>
                                                <th className="text-left py-1">Expiry Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-black">
                                            {expiringPermits.length === 0 ? (
                                                <tr><td colSpan={3} className="py-3 text-center text-gray-500">No upcoming expiries</td></tr>
                                            ) : (
                                                expiringPermits.map((p, i) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="py-1">{p.driver} <span className="text-xs text-gray-500 ml-2">({p.vehicle})</span></td>
                                                        <td className="py-1">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${(new Date(p.expiry) < new Date()) ? 'bg-red-200 text-red-800' :
                                                                p.status && p.status.toLowerCase().includes('approved') ? 'bg-green-200 text-green-800' :
                                                                    p.status && (p.status.toLowerCase().includes('rejected') || p.status.toLowerCase().includes('suspended')) ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                                                                }`}>
                                                                {p.status ? p.status.toUpperCase() : (new Date(p.expiry) < new Date() ? 'EXPIRED' : 'N/A')}
                                                            </span>
                                                        </td>
                                                        <td className="py-1">{p.expiry ? new Date(p.expiry).toLocaleDateString() : '-'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Suspended/Revoked Card */}
                                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border-l-4 border-red-400">
                                    <h2 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2"><svg className="w-5 h-5 text-red-800" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 8v4l3 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>Suspended / Revoked</h2>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-black">
                                                <th className="text-left py-1">Driver / Vehicle</th>
                                                <th className="text-left py-1">Status</th>
                                                <th className="text-left py-1">Expiry Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-black">
                                            {suspendedPermits.length === 0 ? (
                                                <tr><td colSpan={3} className="py-3 text-center text-gray-500">No suspended permits</td></tr>
                                            ) : (
                                                suspendedPermits.map((p, i) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="py-1">{p.driver} <span className="text-xs text-gray-500 ml-2">({p.vehicle})</span></td>
                                                        <td className="py-1">
                                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800">
                                                                {p.status ? p.status.toUpperCase() : 'SUSPENDED'}
                                                            </span>
                                                        </td>
                                                        <td className="py-1">{p.expiry ? new Date(p.expiry).toLocaleDateString() : '-'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Analytics Snapshot Card */}
                                <div className="bg-indigo-100 p-6 rounded-xl shadow-lg border-l-4 border-indigo-400 flex flex-col justify-between">
                                    <h2 className="text-lg font-bold text-indigo-900 mb-2">Analytics Snapshot</h2>
                                    <div className="flex-1 flex items-center justify-center">
                                        {/* Placeholder for chart/graph */}
                                        <span className="text-4xl text-blue-400 font-extrabold">📊</span>
                                    </div>
                                    <div className="mt-4 text-sm text-indigo-900">Overview of key metrics and trends.</div>
                                </div>
                            </div>
                        </>
                    )}
                    {activeSidebar === "Search Permits" && (
                        <SearchPermit />
                    )}
                    {activeSidebar === "Pairing Wizard" && (
                        <PairingWizard />
                    )}
                    {activeSidebar === "Entity Details" && (
                        <EntityDetail />
                    )}
                    {activeSidebar === "Admin Configuration" && (
                        <AdminConfiguration />
                    )}
                    {activeSidebar === "Analytics & BI Hub" && (
                        <AnalyticsBIHub />
                    )}
                    {activeSidebar === "Public Verification" && (
                        <PublicVerification />
                    )}
                </main>
            </div>
        </div>
    );
}
