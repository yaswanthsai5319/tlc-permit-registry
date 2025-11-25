"use client";
import React, { useState, useEffect } from "react";
import { Filter, Search } from "lucide-react";
import { storage } from '@/app/utils/storage';

const permitTypes = ["All", "Vehicle", "Driver", "Base"];
const statuses = ["All", "Approved", "Rejected", "Pending"];
const boroughs = ["All", "Manhattan", "Queens", "Brooklyn", "Bronx", "Staten Island"];

// local data is read from localStorage via storage.get('permits')

function paginate(array, page_size, page_number) {
    return array.slice((page_number - 1) * page_size, page_number * page_size);
}

export default function SearchPermit() {
    const [type, setType] = useState("All");
    const [status, setStatus] = useState("All");
    const [borough, setBorough] = useState("All");
    const [sortBy, setSortBy] = useState("id");
    const [sortDir, setSortDir] = useState("asc");
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const [permits, setPermits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const stored = storage.get('permits') || [];
        setPermits(stored);
    }, []);

    // Filter and sort
    let filtered = permits.filter(p =>
        (type === "All" || p.type === type) &&
        (status === "All" || (p.status ? p.status.toLowerCase() === status.toLowerCase() : false)) &&
        (borough === "All" || (p.borough && p.borough === borough)) &&
        (searchTerm === '' || [p.id, p.driverName, p.vehiclePlate].join(' ').toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const getSortValue = (item, key) => {
        if (!item) return '';
        switch (key) {
            case 'driver':
                return (item.driverName || '').toString().toLowerCase();
            case 'vehicle':
                return (item.vehiclePlate || '').toString().toLowerCase();
            case 'expiry':
                const dateStr = (item.licenseExpiry || item.expiry || '');
                const parsed = Date.parse(dateStr);
                return isNaN(parsed) ? dateStr.toString() : parsed;
            default:
                return ((item[key] || '')).toString().toLowerCase();
        }
    };

    filtered = [...filtered].sort((a, b) => {
        const A = getSortValue(a, sortBy);
        const B = getSortValue(b, sortBy);
        if (A < B) return sortDir === "asc" ? -1 : 1;
        if (A > B) return sortDir === "asc" ? 1 : -1;
        return 0;
    });
    const totalPages = Math.ceil(filtered.length / pageSize);
    const paged = paginate(filtered, pageSize, page);

    const handleSort = col => {
        if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else {
            setSortBy(col);
            setSortDir("asc");
        }
    };

    useEffect(() => {
        // ensure current page is within bounds when filtered length changes
        const totalPagesNow = Math.ceil(filtered.length / pageSize) || 1;
        if (page > totalPagesNow) setPage(totalPagesNow);
    }, [filtered.length]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
            {/* NAVBAR */}


            <div className="flex flex-1">
                {/* MAIN */}
                <main className="flex-1 p-8 lg:p-12">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2 tracking-tight">Search & Browse Permits</h1>
                        <p className="text-slate-600 mb-8">Find and filter TLC permits with ease</p>

                        {/* Filter Section */}
                        <div className="mb-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Filter className="w-5 h-5 text-slate-700" />
                                <span className="font-semibold text-slate-900">Filter Options</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="relative lg:col-span-2">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        value={searchTerm}
                                        onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                                        placeholder="Search permits, driver or plate"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                    />
                                </div>
                                <select
                                    value={type}
                                    onChange={e => { setType(e.target.value); setPage(1); }}
                                    className="px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all cursor-pointer">
                                    {permitTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <select
                                    value={status}
                                    onChange={e => { setStatus(e.target.value); setPage(1); }}
                                    className="px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all cursor-pointer">
                                    {statuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <select
                                    value={borough}
                                    onChange={e => { setBorough(e.target.value); setPage(1); }}
                                    className="px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all cursor-pointer">
                                    {boroughs.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            {[{ "key": "id", "label": "Permit ID" }, { "key": "driver", "label": "Driver" }, { "key": "vehicle", "label": "Vehicle" }, { "key": "status", "label": "Status" }, { "key": "borough", "label": "Borough" }, { "key": "expiry", "label": "Expiry" }].map(col => (
                                                <th
                                                    key={col.key}
                                                    className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:text-slate-900 transition-colors"
                                                    onClick={() => handleSort(col.key)}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        {col.label}
                                                        <span className="text-xs">
                                                            {sortBy === col.key ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                                                        </span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paged.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 px-6 text-center text-slate-500">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Search className="w-12 h-12 text-slate-300" />
                                                        <p className="font-medium">No permits found</p>
                                                        <p className="text-sm text-slate-400">Try adjusting your filters</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paged.map((p, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 px-6 font-semibold text-sm text-slate-900">{p.id}</td>
                                                    <td className="py-4 px-6 text-sm text-slate-700">{p.driverName || '-'}</td>
                                                    <td className="py-4 px-6 text-sm text-slate-700 font-medium">{p.vehiclePlate || '-'}</td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${p.status && p.status.toLowerCase().includes('approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            p.status && p.status.toLowerCase().includes('pending') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                p.status && (p.status.toLowerCase().includes('suspended') || p.status.toLowerCase().includes('revoked')) ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                    'bg-red-50 text-red-700 border-red-200'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${p.status && p.status.toLowerCase().includes('approved') ? 'bg-emerald-500' :
                                                                p.status && p.status.toLowerCase().includes('pending') ? 'bg-amber-500' :
                                                                    p.status && (p.status.toLowerCase().includes('suspended') || p.status.toLowerCase().includes('revoked')) ? 'bg-orange-500' :
                                                                        'bg-red-500'
                                                                }`}></span>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm text-slate-700">{p.borough || '-'}</td>
                                                    <td className="py-4 px-6 text-sm text-slate-700">{p.licenseExpiry ? new Date(p.licenseExpiry).toLocaleDateString() : (p.expiry ? p.expiry : '-')}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex justify-between items-center gap-4 px-6 py-4 bg-slate-50 border-t border-slate-200">
                                <p className="text-sm text-slate-600">
                                    Showing <span className="font-semibold text-slate-900">{paged.length}</span> of <span className="font-semibold text-slate-900">{filtered.length}</span> results
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 text-sm font-semibold text-slate-700">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        className="px-4 py-2 rounded-lg border border-slate-900 bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
