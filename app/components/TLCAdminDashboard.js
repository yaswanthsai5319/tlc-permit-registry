import React, { useState } from "react";
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

const expiringPermits = [
    { type: "Vehicle", status: "ACTIVE", expiry: "2024-07-10" },
    { type: "Driver", status: "EXPIRED", expiry: "2024-07-08" },
    { type: "Base", status: "SUSPENDED", expiry: "2024-07-12" },
];

const suspendedPermits = [
    { type: "Driver", status: "SUSPENDED", expiry: "2024-06-30" },
];

export default function TLCAdminDashboard({ user, onLogout }) {
    const [activeSidebar, setActiveSidebar] = useState("Dashboard");

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
            {/* NAVBAR */}
            <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button className="text-blue-700 font-bold text-lg">☰ App Switcher</button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute right-2 top-2 w-5 h-5 text-gray-400" />
                    </div>
                    <button className="relative">
                        <Bell className="w-6 h-6 text-blue-700" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                    </button>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 rounded-lg shadow transition-colors font-semibold"
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
                                className={`flex items-center w-full px-4 py-2 rounded-lg font-semibold transition ${
                                    activeSidebar === opt.label
                                        ? "bg-blue-100 text-blue-700"
                                        : "text-gray-700 hover:bg-blue-50"
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
                            <h1 className="text-2xl font-extrabold text-blue-800 mb-6">Permit Registry Dashboard</h1>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                {/* Expiring Soon Card */}
                                <div className="bg-yellow-100 p-6 rounded-xl shadow-lg border-l-4 border-yellow-400">
                                    <h2 className="text-lg font-bold text-yellow-800 mb-2">Expiring Soon</h2>
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr>
                                            <th className="text-left py-1">Permit Type</th>
                                            <th className="text-left py-1">Status</th>
                                            <th className="text-left py-1">Expiry Date</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {expiringPermits.map((p, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="py-1">{p.type}</td>
                                                <td className="py-1">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                            p.status === "ACTIVE"
                                                                ? "bg-green-200 text-green-800"
                                                                : p.status === "EXPIRED"
                                                                    ? "bg-red-200 text-red-800"
                                                                    : "bg-yellow-200 text-yellow-800"
                                                        }`}>
                                                            {p.status}
                                                        </span>
                                                </td>
                                                <td className="py-1">{p.expiry}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Suspended/Revoked Card */}
                                <div className="bg-red-100 p-6 rounded-xl shadow-lg border-l-4 border-red-400">
                                    <h2 className="text-lg font-bold text-red-800 mb-2">Suspended/Revoked</h2>
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr>
                                            <th className="text-left py-1">Permit Type</th>
                                            <th className="text-left py-1">Status</th>
                                            <th className="text-left py-1">Expiry Date</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {suspendedPermits.map((p, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="py-1">{p.type}</td>
                                                <td className="py-1">
                                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-200 text-red-800">
                                                            {p.status}
                                                        </span>
                                                </td>
                                                <td className="py-1">{p.expiry}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Analytics Snapshot Card */}
                                <div className="bg-blue-100 p-6 rounded-xl shadow-lg border-l-4 border-blue-400 flex flex-col justify-between">
                                    <h2 className="text-lg font-bold text-blue-800 mb-2">Analytics Snapshot</h2>
                                    <div className="flex-1 flex items-center justify-center">
                                        {/* Placeholder for chart/graph */}
                                        <span className="text-4xl text-blue-400 font-extrabold">📊</span>
                                    </div>
                                    <div className="mt-4 text-sm text-blue-700">Overview of key metrics and trends.</div>
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
                        <AdminConfiguration/>
                    )}
                    {activeSidebar === "Analytics & BI Hub" && (
                        <AnalyticsBIHub/>
                    )}
                    {activeSidebar === "Public Verification" && (
                       <PublicVerification/>
                    )}
                </main>
            </div>
        </div>
    );
}
