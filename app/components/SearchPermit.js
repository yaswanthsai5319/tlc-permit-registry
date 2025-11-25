"use client";
import React, { useState, useEffect } from "react";
import { Filter, Search } from "lucide-react";
import { storage } from '@/app/utils/storage';

const permitTypes = ["All", "Vehicle", "Driver", "Base"];
const statuses = ["All", "ACTIVE", "SUSPENDED", "EXPIRED"];
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
        (status === "All" || (p.status ? p.status.toUpperCase() === status : status === 'All')) &&
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
            {/* NAVBAR */}


            <div className="flex flex-1">
                {/* MAIN */}
                <main className="flex-1 p-8 bg-gradient-to-br from-white via-blue-50 to-indigo-100">
                    <h1 className="text-2xl font-extrabold text-indigo-900 mb-6">Search & Browse Permits</h1>
                    {/* Filter Section */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-500" />
                            <span className="font-semibold text-gray-700">Filter Options:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-gray-500" />
                            <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Search permits, driver or plate" className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
                            className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-indigo-500">
                            {permitTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                            className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500">
                            {statuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <select value={borough} onChange={e => { setBorough(e.target.value); setPage(1); }}
                            className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500">
                            {boroughs.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    {/* Table */}
                    <div className="bg-white rounded-xl shadow overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="sticky top-0 bg-indigo-100 z-10">
                                <tr>
                                    {[{ "key": "id", "label": "Permit ID" }, { "key": "driver", "label": "Driver" }, { "key": "vehicle", "label": "Vehicle" }, { "key": "status", "label": "Status" }, { "key": "borough", "label": "Borough" }, { "key": "expiry", "label": "Expiry" }].map(col => (
                                        <th
                                            key={col.key}
                                            className="py-3 px-6 text-left font-semibold text-gray-700 cursor-pointer select-none"
                                            onClick={() => handleSort(col.key)}
                                        >
                                            {col.label}
                                            <span className="ml-1 text-xs">
                                                {sortBy === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-black">
                                {paged.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-6 px-6 text-center text-gray-500">
                                            No permits found.
                                        </td>
                                    </tr>
                                ) : (
                                    paged.map((p, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50 hover:bg-indigo-50" : "bg-white hover:bg-indigo-50"}>
                                            <td className="py-3 px-6 font-semibold text-blue-900">{p.id}</td>
                                            <td className="py-3 px-6">{p.driverName || '-'}</td>
                                            <td className="py-3 px-6">{p.vehiclePlate || '-'}</td>
                                            <td className="py-3 px-6">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.status && p.status.toLowerCase().includes('approved') ? 'bg-green-200 text-green-800' :
                                                    p.status && p.status.toLowerCase().includes('pending') ? 'bg-orange-100 text-orange-800' :
                                                        p.status && (p.status.toLowerCase().includes('suspended') || p.status.toLowerCase().includes('revoked')) ? 'bg-yellow-200 text-yellow-800' :
                                                            'bg-red-200 text-red-800'
                                                    }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6">{p.borough || '-'}</td>
                                            <td className="py-3 px-6">{p.licenseExpiry ? new Date(p.licenseExpiry).toLocaleDateString() : (p.expiry ? p.expiry : '-')}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {/* Pagination */}
                        <div className="flex justify-end items-center gap-2 p-4">
                            <button
                                className="px-3 py-1 rounded bg-indigo-100 text-indigo-900 font-semibold disabled:opacity-50"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Prev
                            </button>
                            <span className="font-semibold text-gray-700">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold disabled:opacity-50"
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
