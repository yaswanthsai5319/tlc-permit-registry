"use client";
import React, { useEffect, useState, useMemo } from "react";
import { X, BarChart2, MapPin, TrendingUp, AlertTriangle, Users, Car, FileText, Shield, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { storage } from '@/app/utils/storage';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Drill-down Modal Component
const DrillDownModal = ({ isOpen, onClose, borough, pairings, permits }) => {
    if (!isOpen) return null;

    const boroughPairings = pairings.filter(p => {
        const permit = permits.find(pm => pm.vehiclePlate === p.vehiclePlate || pm.licenseNo === p.driverLicense);
        return permit?.borough === borough;
    });

    const activePairings = boroughPairings.filter(p => new Date(p.end) > new Date());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-blue-600">
                    <h3 className="text-2xl font-bold text-white">{borough} - Detailed View</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-all">
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <div className="text-sm text-blue-600 font-semibold mb-1">Total Pairings</div>
                            <div className="text-3xl font-bold text-blue-900">{boroughPairings.length}</div>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                            <div className="text-sm text-emerald-600 font-semibold mb-1">Active Pairings</div>
                            <div className="text-3xl font-bold text-emerald-900">{activePairings.length}</div>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                            <div className="text-sm text-amber-600 font-semibold mb-1">Unique Drivers</div>
                            <div className="text-3xl font-bold text-amber-900">{new Set(boroughPairings.map(p => p.driverLicense)).size}</div>
                        </div>
                    </div>

                    <h4 className="font-bold text-lg text-slate-900 mb-4">Active Pairings</h4>
                    <div className="space-y-3">
                        {activePairings.length > 0 ? activePairings.map(pairing => (
                            <div key={pairing.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <span className="font-semibold text-slate-700">Driver:</span>
                                        <div className="text-slate-900">{pairing.driverName || pairing.driverLicense}</div>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-700">Vehicle:</span>
                                        <div className="text-slate-900">{pairing.vehiclePlate}</div>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-700">Base:</span>
                                        <div className="text-slate-900">{pairing.baseNo}</div>
                                    </div>
                                    <div className="md:col-span-3">
                                        <span className="font-semibold text-slate-700">Duration:</span>
                                        <div className="text-slate-900">
                                            {new Date(pairing.start).toLocaleString()} → {new Date(pairing.end).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-slate-500">No active pairings found</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function AnalyticsBIHub() {
    const [filterDate, setFilterDate] = useState("");
    const [filterBorough, setFilterBorough] = useState("");
    const [filterBase, setFilterBase] = useState("");
    const [filterCarrier, setFilterCarrier] = useState("");
    const [drillDownBorough, setDrillDownBorough] = useState(null);

    const [permits, setPermits] = useState([]);
    const [pairings, setPairings] = useState([]);
    const [vehicleApplications, setVehicleApplications] = useState([]);
    const [driverPermits, setDriverPermits] = useState([]);

    useEffect(() => {
        setPermits(storage.get('permits') || []);
        setPairings(storage.get('pairings') || []);
        setVehicleApplications(storage.get('vehicleApplications') || []);
        setDriverPermits(storage.get('driverPermits') || []);
    }, []);

    // Get unique bases and carriers for filters
    const bases = useMemo(() => {
        const baseSet = new Set();
        permits.forEach(p => p.baseNo && baseSet.add(p.baseNo));
        pairings.forEach(p => p.baseNo && baseSet.add(p.baseNo));
        return Array.from(baseSet);
    }, [permits, pairings]);

    const carriers = useMemo(() => {
        const carrierSet = new Set();
        permits.forEach(p => p.insuranceCarrier && carrierSet.add(p.insuranceCarrier));
        return Array.from(carrierSet);
    }, [permits]);

    // Filter permits based on all filters
    const filteredPermits = useMemo(() => {
        return permits.filter(p => {
            if (filterDate && p.submittedAt && !p.submittedAt.startsWith(filterDate)) return false;
            if (filterBorough && p.borough !== filterBorough) return false;
            if (filterBase && p.baseNo !== filterBase) return false;
            if (filterCarrier && p.insuranceCarrier !== filterCarrier) return false;
            return true;
        });
    }, [permits, filterDate, filterBorough, filterBase, filterCarrier]);

    const filteredPairings = useMemo(() => {
        return pairings.filter(p => {
            if (filterDate && p.start && !p.start.startsWith(filterDate)) return false;
            if (filterBase && p.baseNo !== filterBase) return false;
            const permit = permits.find(pm => pm.vehiclePlate === p.vehiclePlate || pm.licenseNo === p.driverLicense);
            if (filterBorough && permit?.borough !== filterBorough) return false;
            if (filterCarrier && permit?.insuranceCarrier !== filterCarrier) return false;
            return true;
        });
    }, [pairings, permits, filterDate, filterBorough, filterBase, filterCarrier]);

    // ===== DRIVER UTILIZATION METRICS =====
    const driverUtilization = useMemo(() => {
        const byDate = {};
        filteredPairings.forEach(p => {
            const d = p.start ? p.start.split('T')[0] : null;
            if (!d) return;
            if (!byDate[d]) byDate[d] = { date: d, active: 0, idle: 0 };
            const now = new Date();
            const end = new Date(p.end);
            if (end > now) byDate[d].active += 1;
            else byDate[d].idle += 1;
        });
        return Object.values(byDate);
    }, [filteredPairings]);

    const topDrivers = useMemo(() => {
        const driverCount = {};
        filteredPairings.forEach(p => {
            const driver = p.driverName || p.driverLicense;
            driverCount[driver] = (driverCount[driver] || 0) + 1;
        });
        return Object.entries(driverCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [filteredPairings]);

    const idleVsActiveRatio = useMemo(() => {
        let active = 0, idle = 0;
        const now = new Date();
        filteredPairings.forEach(p => {
            const end = new Date(p.end);
            if (end > now) active++;
            else idle++;
        });
        return [
            { name: 'Active', value: active },
            { name: 'Idle', value: idle }
        ];
    }, [filteredPairings]);

    // ===== VEHICLE UTILIZATION METRICS =====
    const vehicleUtilization = useMemo(() => {
        const totalVehicles = new Set([...filteredPermits.map(p => p.vehiclePlate), ...vehicleApplications.map(v => v.licensePlate)]).size;
        const activeVehicles = new Set(filteredPairings.filter(p => new Date(p.end) > new Date()).map(p => p.vehiclePlate)).size;
        return { total: totalVehicles, active: activeVehicles };
    }, [filteredPermits, vehicleApplications, filteredPairings]);

    const idleVehicles = useMemo(() => {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentlyActive = new Set(
            filteredPairings.filter(p => new Date(p.end) > sevenDaysAgo).map(p => p.vehiclePlate)
        );
        const allVehicles = new Set([...filteredPermits.map(p => p.vehiclePlate), ...vehicleApplications.map(v => v.licensePlate)]);
        const idleCount = allVehicles.size - recentlyActive.size;
        const idlePercent = allVehicles.size > 0 ? Math.round((idleCount / allVehicles.size) * 100) : 0;
        return { count: idleCount, percent: idlePercent };
    }, [filteredPermits, vehicleApplications, filteredPairings]);

    const basePerformance = useMemo(() => {
        const baseStats = {};
        filteredPairings.forEach(p => {
            if (!baseStats[p.baseNo]) baseStats[p.baseNo] = 0;
            baseStats[p.baseNo] += 1;
        });
        return Object.entries(baseStats)
            .map(([base, count]) => ({ base, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [filteredPairings]);

    // ===== PERMIT UTILIZATION METRICS =====
    const permitUtilization = useMemo(() => {
        const now = new Date();
        let active = 0, expired = 0;
        filteredPermits.forEach(p => {
            const expiry = p.permitEndDate || p.licenseExpiry || p.insuranceExpiry;
            if (expiry && new Date(expiry) < now) expired++;
            else active++;
        });
        return [
            { name: 'Active', value: active },
            { name: 'Expired', value: expired }
        ];
    }, [filteredPermits]);

    const renewalRates = useMemo(() => {
        const categories = {
            'Vehicle': vehicleApplications.filter(v => v.status?.toLowerCase() === 'approved').length,
            'Driver': driverPermits.filter(d => d.status?.toLowerCase() === 'approved').length,
            'Base': filteredPermits.filter(p => p.baseNo && p.status?.toLowerCase() === 'approved').length
        };
        return Object.entries(categories).map(([category, count]) => ({ category, count }));
    }, [vehicleApplications, driverPermits, filteredPermits]);

    const suspensionRevocation = useMemo(() => {
        const byDate = {};
        [...filteredPermits, ...vehicleApplications, ...driverPermits].forEach(p => {
            if (p.status?.toLowerCase().includes('suspend') || p.status?.toLowerCase().includes('revok')) {
                const d = p.submittedAt ? p.submittedAt.split('T')[0] : null;
                if (!d) return;
                if (!byDate[d]) byDate[d] = { date: d, count: 0 };
                byDate[d].count += 1;
            }
        });
        return Object.values(byDate);
    }, [filteredPermits, vehicleApplications, driverPermits]);

    // ===== COMPLIANCE METRICS =====
    const complianceMetrics = useMemo(() => {
        const totalPairings = filteredPairings.length;
        const blockedPairings = filteredPermits.filter(p => p.status?.toLowerCase() === 'rejected').length;
        const driversWithViolations = driverPermits.filter(d => d.violationsDeclaration && d.violationsDeclaration.toLowerCase() !== 'none').length;
        const totalDrivers = driverPermits.length;

        const now = new Date();
        let insuranceGaps = 0;
        filteredPairings.forEach(p => {
            const permit = filteredPermits.find(pm => pm.vehiclePlate === p.vehiclePlate);
            if (permit?.insuranceExpiry) {
                const insExpiry = new Date(permit.insuranceExpiry);
                const pairingEnd = new Date(p.end);
                if (insExpiry < pairingEnd) insuranceGaps++;
            }
        });

        return {
            blockedPercent: totalPairings > 0 ? Math.round((blockedPairings / totalPairings) * 100) : 0,
            violationsPercent: totalDrivers > 0 ? Math.round((driversWithViolations / totalDrivers) * 100) : 0,
            insuranceGaps: insuranceGaps
        };
    }, [filteredPairings, filteredPermits, driverPermits]);

    // ===== HEATMAPS & GEO VISUALS =====
    const boroughUtilization = useMemo(() => {
        const map = {};
        filteredPermits.forEach(p => {
            const b = p.borough || 'Unknown';
            if (!map[b]) map[b] = { borough: b, total: 0, approved: 0 };
            map[b].total += 1;
            if (p.status && p.status.toLowerCase().includes('approved')) map[b].approved += 1;
        });
        return Object.values(map).map(m => ({
            borough: m.borough,
            utilization: m.total > 0 ? Math.round((m.approved / m.total) * 100) : 0
        }));
    }, [filteredPermits]);

    const timeOfDayPeaks = useMemo(() => {
        const hourCounts = Array(24).fill(0);
        filteredPairings.forEach(p => {
            const hour = new Date(p.start).getHours();
            hourCounts[hour] += 1;
        });
        return hourCounts.map((count, hour) => ({
            hour: `${hour}:00`,
            count
        }));
    }, [filteredPairings]);

    const weeklyTrends = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayCounts = Array(7).fill(0);
        filteredPairings.forEach(p => {
            const day = new Date(p.start).getDay();
            dayCounts[day] += 1;
        });
        return dayCounts.map((count, idx) => ({
            day: days[idx],
            count
        }));
    }, [filteredPairings]);

    const handleExportCSV = () => {
        if (!permits || permits.length === 0) {
            alert("No data to export.");
            return;
        }

        const headers = ["ID", "Driver Name", "License No", "Vehicle Plate", "VIN", "Base Name", "Status", "Expiry Date", "Insurance Expiry"];
        const csvContent = [
            headers.join(","),
            ...permits.map(p => [
                p.id,
                `"${p.driverName || ''}"`,
                p.licenseNo || '',
                p.vehiclePlate || '',
                p.vin || '',
                `"${p.baseName || ''}"`,
                p.status || '',
                p.licenseExpiry || '',
                p.insuranceExpiry || ''
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tlc_permits_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <BarChart2 className="w-6 h-6 text-slate-700" />
                            <span className="font-bold text-slate-900 text-xl">Analytics & BI Hub</span>
                        </div>
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Export Data
                        </button>
                    </div>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <input
                            type="date"
                            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            placeholder="Date"
                        />
                        <select
                            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all cursor-pointer text-sm"
                            value={filterBorough}
                            onChange={e => setFilterBorough(e.target.value)}
                        >
                            <option value="">All Boroughs</option>
                            {boroughUtilization.map(b => (
                                <option key={b.borough} value={b.borough}>{b.borough}</option>
                            ))}
                        </select>
                        <select
                            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all cursor-pointer text-sm"
                            value={filterBase}
                            onChange={e => setFilterBase(e.target.value)}
                        >
                            <option value="">All Bases</option>
                            {bases.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                        <select
                            className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all cursor-pointer text-sm"
                            value={filterCarrier}
                            onChange={e => setFilterCarrier(e.target.value)}
                        >
                            <option value="">All Carriers</option>
                            {carriers.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </nav>

                <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* DRIVER UTILIZATION */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="font-bold text-xl text-slate-900">Driver Utilization</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                    <div className="text-sm text-blue-600 font-semibold mb-2">Idle vs Active Ratio</div>
                                    <ResponsiveContainer width="100%" height={150}>
                                        <PieChart>
                                            <Pie data={idleVsActiveRatio} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                                                {idleVsActiveRatio.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f59e0b'} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="font-semibold mb-4 text-slate-700">Top Drivers by Pairing Frequency</div>
                                    <ResponsiveContainer width="100%" height={150}>
                                        <BarChart data={topDrivers} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis type="number" stroke="#64748b" />
                                            <YAxis type="category" dataKey="name" stroke="#64748b" width={100} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#3b82f6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <div className="font-semibold mb-4 text-slate-700">Active Drivers Over Time</div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={driverUtilization}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={3} name="Active" />
                                            <Line type="monotone" dataKey="idle" stroke="#f59e0b" strokeWidth={3} name="Idle" />
                                            <Legend />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <div className="font-semibold mb-4 text-slate-700">Average Pairing Duration</div>
                                    <div className="flex items-center justify-center h-[200px]">
                                        <div className="text-center">
                                            <div className="text-5xl font-bold text-blue-600">
                                                {filteredPairings.length > 0 ?
                                                    Math.round(filteredPairings.reduce((acc, p) => {
                                                        const duration = (new Date(p.end) - new Date(p.start)) / (1000 * 60 * 60);
                                                        return acc + duration;
                                                    }, 0) / filteredPairings.length) : 0}
                                            </div>
                                            <div className="text-sm text-slate-600 mt-2">hours (average)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* VEHICLE UTILIZATION */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <Car className="w-6 h-6 text-emerald-600" />
                                </div>
                                <span className="font-bold text-xl text-slate-900">Vehicle Utilization</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                                    <div className="text-sm text-emerald-600 font-semibold mb-2">Daily Active vs Total</div>
                                    <div className="text-4xl font-bold text-emerald-900">{vehicleUtilization.active}</div>
                                    <div className="text-sm text-emerald-700">of {vehicleUtilization.total} vehicles</div>
                                </div>
                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                                    <div className="text-sm text-amber-600 font-semibold mb-2">Fleet Idle &gt;7 Days</div>
                                    <div className="text-4xl font-bold text-amber-900">{idleVehicles.percent}%</div>
                                    <div className="text-sm text-amber-700">{idleVehicles.count} vehicles</div>
                                </div>
                                <div className="md:col-span-1">
                                    <div className="font-semibold mb-4 text-slate-700">High Performing Bases</div>
                                    <div className="space-y-2">
                                        {basePerformance.slice(0, 3).map((base, idx) => (
                                            <div key={base.base} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                                <span className="text-sm font-medium text-slate-700">{base.base}</span>
                                                <span className="text-sm font-bold text-emerald-600">{base.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PERMIT UTILIZATION */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <FileText className="w-6 h-6 text-purple-600" />
                                </div>
                                <span className="font-bold text-xl text-slate-900">Permit Utilization</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <div className="font-semibold mb-4 text-slate-700">Active vs Expired Permits</div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={permitUtilization} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                                                {permitUtilization.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <div className="font-semibold mb-4 text-slate-700">Renewal Rates by Category</div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={renewalRates}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="category" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#8b5cf6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <div className="font-semibold mb-4 text-slate-700">Suspension/Revocation Over Time</div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={suspensionRevocation}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* COMPLIANCE METRICS */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <Shield className="w-6 h-6 text-red-600" />
                                </div>
                                <span className="font-bold text-xl text-slate-900">Compliance Metrics</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                        <div className="text-sm text-red-600 font-semibold">Blocked Pairings</div>
                                    </div>
                                    <div className="text-4xl font-bold text-red-900">{complianceMetrics.blockedPercent}%</div>
                                    <div className="text-sm text-red-700 mt-1">due to failed checks</div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                                        <div className="text-sm text-orange-600 font-semibold">Drivers with Violations</div>
                                    </div>
                                    <div className="text-4xl font-bold text-orange-900">{complianceMetrics.violationsPercent}%</div>
                                    <div className="text-sm text-orange-700 mt-1">of total drivers</div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                        <div className="text-sm text-yellow-600 font-semibold">Insurance Coverage Gaps</div>
                                    </div>
                                    <div className="text-4xl font-bold text-yellow-900">{complianceMetrics.insuranceGaps}</div>
                                    <div className="text-sm text-yellow-700 mt-1">pairings affected</div>
                                </div>
                            </div>
                        </div>

                        {/* HEATMAPS & GEO VISUALS */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <MapPin className="w-6 h-6 text-indigo-600" />
                                </div>
                                <span className="font-bold text-xl text-slate-900">Heatmaps & Geo Visuals</span>
                            </div>

                            <div className="font-semibold mb-6 text-slate-700">Borough Utilization Density</div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
                                {boroughUtilization.map(b => (
                                    <button
                                        key={b.borough}
                                        onClick={() => setDrillDownBorough(b.borough)}
                                        className="flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
                                    >
                                        <div
                                            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-4 border-white hover:shadow-xl transition-shadow"
                                            style={{
                                                background: `linear-gradient(135deg, #6366f1 ${b.utilization}%, #e0e7ff 100%)`
                                            }}
                                            title={`Click to view details - ${b.utilization}%`}
                                        >
                                            {b.utilization}%
                                        </div>
                                        <div className="mt-3 text-sm font-medium text-slate-700">{b.borough}</div>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                                <div>
                                    <div className="font-semibold mb-4 text-slate-700">Time-of-Day Pairing Peaks</div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={timeOfDayPeaks}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="hour" stroke="#64748b" interval={2} />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div>
                                    <div className="font-semibold mb-4 text-slate-700">Weekly Trends</div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={weeklyTrends}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="day" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#ec4899" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Drill-down Modal */}
            <DrillDownModal
                isOpen={drillDownBorough !== null}
                onClose={() => setDrillDownBorough(null)}
                borough={drillDownBorough}
                pairings={pairings}
                permits={permits}
            />
        </div>
    );
}
