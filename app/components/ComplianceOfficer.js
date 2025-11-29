"use client";
import React, { useState, useEffect } from "react";
import { Shield, FileText, Download, Search, AlertTriangle, LogOut, Filter, Bell, HelpCircle, Grid } from "lucide-react";
import { storage } from '../utils/storage';

export default function ComplianceOfficer({ user, onLogout }) {
    const [permits, setPermits] = useState([]);
    const [pairings, setPairings] = useState([]);
    const [vehicleApplications, setVehicleApplications] = useState([]);
    const [driverPermits, setDriverPermits] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [activeTab, setActiveTab] = useState("permits");

    useEffect(() => {
        setPermits(storage.get('permits') || []);
        setPairings(storage.get('pairings') || []);
        setVehicleApplications(storage.get('vehicleApplications') || []);
        setDriverPermits(storage.get('driverPermits') || []);
    }, []);

    const handleExport = () => {
        const data = {
            permits,
            pairings,
            vehicleApplications,
            driverPermits,
            exportedAt: new Date().toISOString(),
            exportedBy: user.username
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const filteredPermits = permits.filter(p => {
        const matchesSearch = !searchTerm ||
            p.licenseNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || p.status?.toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const suspendedRevoked = permits.filter(p =>
        p.status?.toLowerCase().includes('suspend') ||
        p.status?.toLowerCase().includes('revok') ||
        p.driverSuspended
    );

    const tabs = [
        { key: 'permits', label: 'All Permits', icon: <FileText className="w-4 h-4" /> },
        { key: 'suspended', label: 'Suspended/Revoked', icon: <AlertTriangle className="w-4 h-4" /> },
        { key: 'audit', label: 'Audit Logs', icon: <Shield className="w-4 h-4" /> }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
            {/* NAVBAR */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-indigo-700">
                        <Shield className="w-8 h-8 fill-current" />
                        <span className="text-xl font-bold tracking-tight">Compliance</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <button className="text-slate-500 hover:text-slate-700 transition-colors">
                        <Grid className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Records..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-64"
                        />
                    </div>
                    <button className="relative hover:bg-slate-100 p-2 rounded-lg transition-colors text-slate-600">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </button>
                    <button className="hover:bg-slate-100 p-2 rounded-lg transition-colors text-slate-600">
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-semibold text-slate-900">{user.username}</div>
                            <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-md transition-all font-semibold"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="p-6 md:p-12">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="text-sm text-slate-600 font-semibold mb-2">Total Permits</div>
                            <div className="text-3xl font-bold text-slate-900">{permits.length}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="text-sm text-slate-600 font-semibold mb-2">Active Pairings</div>
                            <div className="text-3xl font-bold text-emerald-600">{pairings.length}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="text-sm text-slate-600 font-semibold mb-2">Suspended/Revoked</div>
                            <div className="text-3xl font-bold text-red-600">{suspendedRevoked.length}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="text-sm text-slate-600 font-semibold mb-2">Driver Applications</div>
                            <div className="text-3xl font-bold text-blue-600">{driverPermits.length}</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-80">
                                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search permits..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md"
                            >
                                <Download className="w-4 h-4" />
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex gap-4">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === tab.key
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6">
                            {activeTab === 'permits' && (
                                <div className="space-y-3">
                                    <div className="text-sm text-slate-600 mb-4">
                                        Showing {filteredPermits.length} of {permits.length} permits
                                    </div>
                                    {filteredPermits.length > 0 ? filteredPermits.map(permit => (
                                        <div key={permit.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <div className="text-xs text-slate-500 font-semibold mb-1">License No</div>
                                                    <div className="text-sm text-slate-900">{permit.licenseNo || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 font-semibold mb-1">Driver Name</div>
                                                    <div className="text-sm text-slate-900">{permit.driverName || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 font-semibold mb-1">Vehicle Plate</div>
                                                    <div className="text-sm text-slate-900">{permit.vehiclePlate || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 font-semibold mb-1">Status</div>
                                                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${permit.status?.toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                        permit.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {permit.status || 'Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 text-slate-500">No permits found</div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'suspended' && (
                                <div className="space-y-3">
                                    <div className="text-sm text-slate-600 mb-4">
                                        {suspendedRevoked.length} suspended or revoked permits
                                    </div>
                                    {suspendedRevoked.length > 0 ? suspendedRevoked.map(permit => (
                                        <div key={permit.id} className="bg-red-50 rounded-lg p-4 border border-red-200">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-xs text-red-600 font-semibold mb-1">License No</div>
                                                        <div className="text-sm text-slate-900">{permit.licenseNo || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-red-600 font-semibold mb-1">Driver Name</div>
                                                        <div className="text-sm text-slate-900">{permit.driverName || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-red-600 font-semibold mb-1">Status</div>
                                                        <div className="text-sm font-semibold text-red-700">{permit.status}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 text-slate-500">No suspended or revoked permits</div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'audit' && (
                                <div className="text-center py-12">
                                    <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <div className="text-lg font-semibold text-slate-600 mb-2">Audit Logs</div>
                                    <div className="text-sm text-slate-500">Audit logging feature coming soon</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
