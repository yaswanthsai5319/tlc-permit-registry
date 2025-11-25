import React, { useState } from "react";
import { Bell, Filter } from "lucide-react";

const permitTypes = ["All", "Vehicle", "Driver", "Base"];
const statuses = ["All", "ACTIVE", "SUSPENDED", "EXPIRED"];
const boroughs = ["All", "Manhattan", "Queens", "Brooklyn", "Bronx", "Staten Island"];

const mockPermits = [
    { id: "12345", status: "ACTIVE", borough: "Manhattan", expiry: "12/31" },
    { id: "67890", status: "SUSPENDED", borough: "Queens", expiry: "10/20" },
    { id: "54321", status: "EXPIRED", borough: "Brooklyn", expiry: "09/15" },
    { id: "98765", status: "ACTIVE", borough: "Bronx", expiry: "11/05" },
];

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
    const pageSize = 3;

    // Filter and sort
    let filtered = mockPermits.filter(p =>
        (type === "All" || p.type === type) &&
        (status === "All" || p.status === status) &&
        (borough === "All" || p.borough === borough)
    );
    filtered = [...filtered].sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortDir === "asc" ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortDir === "asc" ? 1 : -1;
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
            {/* NAVBAR */}


            <div className="flex flex-1">
                {/* MAIN */}
                <main className="flex-1 p-8 bg-gradient-to-br from-white via-blue-50 to-indigo-100">
                    <h1 className="text-2xl font-extrabold text-blue-800 mb-6">Search & Browse Permits</h1>
                    {/* Filter Section */}
                    <div className="mb-6 flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-blue-500" />
                            <span className="font-semibold text-gray-700">Filter Options:</span>
                        </div>
                        <select value={type} onChange={e => setType(e.target.value)}
                                className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500">
                            {permitTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <select value={status} onChange={e => setStatus(e.target.value)}
                                className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500">
                            {statuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <select value={borough} onChange={e => setBorough(e.target.value)}
                                className="px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500">
                            {boroughs.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    {/* Table */}
                    <div className="bg-white rounded-xl shadow overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="sticky top-0 bg-blue-100 z-10">
                            <tr>
                                {["id", "status", "borough", "expiry"].map(col => (
                                    <th
                                        key={col}
                                        className="py-3 px-6 text-left font-semibold text-gray-700 cursor-pointer select-none"
                                        onClick={() => handleSort(col)}
                                    >
                                        {col === "id" ? "Permit ID" : col.charAt(0).toUpperCase() + col.slice(1)}
                                        <span className="ml-1 text-xs">
                        {sortBy === col ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </span>
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-6 px-6 text-center text-gray-500">
                                        No permits found.
                                    </td>
                                </tr>
                            ) : (
                                paged.map((p, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                        <td className="py-3 px-6">{p.id}</td>
                                        <td className="py-3 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            p.status === "ACTIVE"
                                ? "bg-green-200 text-green-800"
                                : p.status === "SUSPENDED"
                                    ? "bg-yellow-200 text-yellow-800"
                                    : "bg-red-200 text-red-800"
                        }`}>
                          {p.status}
                        </span>
                                        </td>
                                        <td className="py-3 px-6">{p.borough}</td>
                                        <td className="py-3 px-6">{p.expiry}</td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                        {/* Pagination */}
                        <div className="flex justify-end items-center gap-2 p-4">
                            <button
                                className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold disabled:opacity-50"
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
