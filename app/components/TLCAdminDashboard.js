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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
            {/* NAVBAR */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button className="text-slate-900 font-bold text-lg hover:text-slate-700 transition-colors">☰ App Switcher</button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all w-64"
                        />
                    </div>
                    <button className="relative hover:bg-slate-100 p-2 rounded-lg transition-colors">
                        <Bell className="w-6 h-6 text-slate-700" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </button>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-md transition-all font-semibold"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="flex flex-1">
                {/* SIDEBAR */}
                <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col py-6 px-4">
                    <nav className="space-y-2">
                        {sidebarOptions.map(opt => (
                            <button
                                key={opt.label}
                                onClick={() => setActiveSidebar(opt.label)}
                                className={`flex items-center w-full px-4 py-3 rounded-lg font-semibold transition-all ${activeSidebar === opt.label
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-700 hover:bg-slate-100"
                                    }`}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-8 lg:p-12">
                    {activeSidebar === "Dashboard" && (
                        <>
                            <div className="max-w-7xl mx-auto">
                                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2 tracking-tight">Permit Registry Dashboard</h1>
                                <p className="text-slate-600 mb-8">Monitor and manage TLC permits</p>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                    {/* Expiring Soon Card */}
                                    <div className="bg-white rounded-2xl shadow-lg border-l-4 border-amber-500 p-6">
                                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-amber-600" />
                                            Expiring Soon
                                        </h2>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-200">
                                                        <th className="text-left py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Driver / Vehicle</th>
                                                        <th className="text-left py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                                        <th className="text-left py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Expiry</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {expiringPermits.length === 0 ? (
                                                        <tr><td colSpan={3} className="py-6 text-center text-slate-500">No upcoming expiries</td></tr>
                                                    ) : (
                                                        expiringPermits.map((p, i) => (
                                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                <td className="py-3 text-slate-900 font-medium">
                                                                    {p.driver}
                                                                    <span className="text-xs text-slate-500 ml-2">({p.vehicle})</span>
                                                                </td>
                                                                <td className="py-3">
                                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${(new Date(p.expiry) < new Date()) ? 'bg-red-50 text-red-700 border-red-200' :
                                                                            p.status && p.status.toLowerCase().includes('approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                                p.status && (p.status.toLowerCase().includes('rejected') || p.status.toLowerCase().includes('suspended')) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        }`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${(new Date(p.expiry) < new Date()) ? 'bg-red-500' :
                                                                                p.status && p.status.toLowerCase().includes('approved') ? 'bg-emerald-500' :
                                                                                    p.status && (p.status.toLowerCase().includes('rejected') || p.status.toLowerCase().includes('suspended')) ? 'bg-red-500' : 'bg-amber-500'
                                                                            }`}></span>
                                                                        {p.status ? p.status.toUpperCase() : (new Date(p.expiry) < new Date() ? 'EXPIRED' : 'N/A')}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 text-slate-700 text-sm">{p.expiry ? new Date(p.expiry).toLocaleDateString() : '-'}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Suspended/Revoked Card */}
                                    <div className="bg-white rounded-2xl shadow-lg border-l-4 border-red-500 p-6">
                                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                            Suspended / Revoked
                                        </h2>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-200">
                                                        <th className="text-left py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Driver / Vehicle</th>
                                                        <th className="text-left py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                                        <th className="text-left py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Expiry</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {suspendedPermits.length === 0 ? (
                                                        <tr><td colSpan={3} className="py-6 text-center text-slate-500">No suspended permits</td></tr>
                                                    ) : (
                                                        suspendedPermits.map((p, i) => (
                                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                <td className="py-3 text-slate-900 font-medium">
                                                                    {p.driver}
                                                                    <span className="text-xs text-slate-500 ml-2">({p.vehicle})</span>
                                                                </td>
                                                                <td className="py-3">
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                                                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-red-500"></span>
                                                                        {p.status ? p.status.toUpperCase() : 'SUSPENDED'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 text-slate-700 text-sm">{p.expiry ? new Date(p.expiry).toLocaleDateString() : '-'}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Analytics Snapshot Card */}
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 flex flex-col justify-between text-white">
                                        <h2 className="text-lg font-bold mb-4">Analytics Snapshot</h2>
                                        <div className="flex-1 flex items-center justify-center">
                                            {/* Placeholder for chart/graph */}
                                            <div className="text-center">
                                                <BarChart2 className="w-16 h-16 mx-auto mb-3 text-slate-400" />
                                                <p className="text-sm text-slate-400">Key metrics and trends</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                                                <div className="text-2xl font-bold">{permits.length}</div>
                                                <div className="text-xs text-slate-400">Total Permits</div>
                                            </div>
                                            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                                                <div className="text-2xl font-bold text-emerald-400">{permits.filter(p => p.status && p.status.toLowerCase().includes('approved')).length}</div>
                                                <div className="text-xs text-slate-400">Approved</div>
                                            </div>
                                        </div>
                                    </div>
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
