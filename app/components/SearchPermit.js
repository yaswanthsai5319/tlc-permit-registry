"use client";
import React, { useState, useEffect } from "react";
import { Filter, Search, Eye, Building, User, Car, FileText, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { storage } from '@/app/utils/storage';

const statuses = ["All", "Approved", "Rejected", "Pending"];
const boroughs = ["All", "Manhattan", "Queens", "Brooklyn", "Bronx", "Staten Island"];

// local data is read from localStorage via storage.get('permits')

function paginate(array, page_size, page_number) {
    return array.slice((page_number - 1) * page_size, page_number * page_size);
}

export default function SearchPermit() {
    const [status, setStatus] = useState("All");
    const [borough, setBorough] = useState("All");
    const [sortBy, setSortBy] = useState("id");
    const [sortDir, setSortDir] = useState("asc");
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const [permits, setPermits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPermits();
    }, []);

    const loadPermits = () => {
        const stored = storage.get('permits') || [];
        setPermits(stored);
    };

    const savePermits = (updated) => {
        storage.set('permits', updated);
        setPermits(updated);
    };

    // View Modal State
    const [viewModal, setViewModal] = useState({
        open: false,
        permit: null
    });

    const [approveModal, setApproveModal] = useState({
        open: false,
        permitId: null,
        start: '',
        end: ''
    });

    const openViewModal = (permit) => {
        setViewModal({ open: true, permit });
    };

    const closeViewModal = () => {
        setViewModal({ open: false, permit: null });
    };

    const openApproveModal = (id) => {
        const today = new Date().toISOString().split('T')[0];
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        const endDate = oneYearLater.toISOString().split('T')[0];

        setApproveModal({
            open: true,
            permitId: id,
            start: today,
            end: endDate
        });
    };

    const approveFromViewModal = () => {
        if (!viewModal.permit) return;
        openApproveModal(viewModal.permit.id);
        closeViewModal();
    };

    const rejectFromViewModal = () => {
        if (!viewModal.permit) return;
        rejectPermit(viewModal.permit.id);
        closeViewModal();
    };

    const rejectPermit = (permitId) => {
        const updatedPermits = permits.map(permit =>
            permit.id === permitId
                ? { ...permit, status: 'rejected', approvedAt: new Date().toISOString() }
                : permit
        );
        savePermits(updatedPermits);
    };

    const buildDefaultSchedule = (start, end) => {
        const days = [];
        let current = new Date(start);
        const last = new Date(end);

        while (current <= last) {
            const dateStr = current.toISOString().split("T")[0];

            for (let hour = 0; hour < 24; hour++) {
                days.push({
                    date: dateStr,
                    hour,
                    status: "available"
                });
            }

            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    const finalizeApproval = () => {
        const { permitId, start, end } = approveModal;

        // Validate dates are selected
        if (!start || !end) {
            alert('Please select both start and end dates');
            return;
        }

        // Validate end date is after start date
        if (new Date(end) <= new Date(start)) {
            alert('End date must be after start date');
            return;
        }

        const updated = permits.map(p =>
            p.id === permitId
                ? {
                    ...p,
                    status: "approved",
                    approvedAt: new Date().toISOString(),
                    schedule: buildDefaultSchedule(start, end)
                }
                : p
        );

        savePermits(updated);
        setApproveModal({ open: false, permitId: null, start: '', end: '' });
    };

    // Filter and sort
    let filtered = permits.filter(p =>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="relative lg:col-span-1">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        value={searchTerm}
                                        onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                                        placeholder="Search permits, driver or plate"
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                    />
                                </div>
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
                                            <th className="py-4 px-6 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
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
                                                    <td className="py-4 px-6">
                                                        <button
                                                            onClick={() => openViewModal(p)}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View
                                                        </button>
                                                    </td>
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

            {/* View Modal */}
            {viewModal.open && viewModal.permit && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Fleet Owner Information */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                <Building className="w-5 h-5 mr-2 text-blue-600" />
                                Fleet Owner Information
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Owner Name</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.fleetOwnerName}</p>
                                </div>
                                {viewModal.permit.fleetOwnerEmail && (
                                    <div>
                                        <p className="text-gray-600">Email</p>
                                        <p className="font-semibold text-gray-900">{viewModal.permit.fleetOwnerEmail}</p>
                                    </div>
                                )}
                                {viewModal.permit.fleetOwnerPhone && (
                                    <div>
                                        <p className="text-gray-600">Phone</p>
                                        <p className="font-semibold text-gray-900">{viewModal.permit.fleetOwnerPhone}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-gray-600">Company Name</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.fleetCompanyName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Base Number</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.baseNo}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Borough</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.borough}</p>
                                </div>
                            </div>
                        </div>
                        {/* Driver & License Information */}
                        <div className="mt-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                <User className="w-5 h-5 mr-2 text-green-600" />
                                Driver & License Information
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Driver Name</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.driverName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">License Number</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.licenseNo}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">License Expiry</p>
                                    <p className="font-semibold text-gray-900">
                                        {viewModal.permit.licenseExpiry ? new Date(viewModal.permit.licenseExpiry).toLocaleDateString() : ''}
                                    </p>
                                </div>
                                {viewModal.permit.driverPhone && (
                                    <div>
                                        <p className="text-gray-600">Phone</p>
                                        <p className="font-semibold text-gray-900">{viewModal.permit.driverPhone}</p>
                                    </div>
                                )}
                                {viewModal.permit.driverEmail && (
                                    <div>
                                        <p className="text-gray-600">Email</p>
                                        <p className="font-semibold text-gray-900">{viewModal.permit.driverEmail}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Vehicle Information */}
                        <div className="mt-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                <Car className="w-5 h-5 mr-2 text-purple-600" />
                                Vehicle Information
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Plate Number</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.vehiclePlate}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">VIN</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.vehicleVin}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Make & Model</p>
                                    <p className="font-semibold text-gray-900">
                                        {viewModal.permit.vehicleMake} {viewModal.permit.vehicleModel}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Year</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.vehicleYear}</p>
                                </div>
                                {viewModal.permit.vehicleColor && (
                                    <div>
                                        <p className="text-gray-600">Color</p>
                                        <p className="font-semibold text-gray-900">{viewModal.permit.vehicleColor}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Insurance Information */}
                        <div className="mt-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-orange-600" />
                                Insurance Information
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Policy Number</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.insurancePolicy}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Carrier</p>
                                    <p className="font-semibold text-gray-900">{viewModal.permit.insuranceCarrier}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Expiry Date</p>
                                    <p className="font-semibold text-gray-900">
                                        {viewModal.permit.insuranceExpiry ? new Date(viewModal.permit.insuranceExpiry).toLocaleDateString() : ''}
                                    </p>
                                </div>
                                {viewModal.permit.insuranceCoverage && (
                                    <div>
                                        <p className="text-gray-600">Coverage Amount</p>
                                        <p className="font-semibold text-gray-900">{viewModal.permit.insuranceCoverage}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Jurisdiction Compliance */}
                        {viewModal.permit.jurisdictionCompliance !== undefined && (
                            <div className="mt-4">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                                    Jurisdiction Compliance
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-600 text-sm mb-1">Compliance Score</p>
                                            <p className="text-3xl font-bold text-indigo-600">
                                                {viewModal.permit.jurisdictionCompliance}%
                                            </p>
                                        </div>
                                        <div className="w-24 h-24">
                                            <svg className="transform -rotate-90" viewBox="0 0 100 100">
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="none"
                                                    stroke="#e5e7eb"
                                                    strokeWidth="8"
                                                />
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="none"
                                                    stroke={
                                                        viewModal.permit.jurisdictionCompliance >= 80
                                                            ? '#10b981'
                                                            : viewModal.permit.jurisdictionCompliance >= 60
                                                                ? '#f59e0b'
                                                                : '#ef4444'
                                                    }
                                                    strokeWidth="8"
                                                    strokeDasharray={`${(viewModal.permit.jurisdictionCompliance / 100) * 251.2} 251.2`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-sm">
                                        <p className={`font-semibold ${viewModal.permit.jurisdictionCompliance >= 80
                                            ? 'text-green-700'
                                            : viewModal.permit.jurisdictionCompliance >= 60
                                                ? 'text-yellow-700'
                                                : 'text-red-700'
                                            }`}>
                                            {viewModal.permit.jurisdictionCompliance >= 80
                                                ? '✓ High Compliance'
                                                : viewModal.permit.jurisdictionCompliance >= 60
                                                    ? '⚠ Moderate Compliance'
                                                    : '✗ Low Compliance'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Modal Actions */}
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={closeViewModal}
                                className="px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300 transition-all"
                            >
                                Close
                            </button>
                            {viewModal.permit.status && viewModal.permit.status.toLowerCase() === 'pending' && (
                                <>
                                    <button
                                        onClick={approveFromViewModal}
                                        className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700 transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={rejectFromViewModal}
                                        className="px-4 py-2 bg-red-600 rounded text-white hover:bg-red-700 transition-all flex items-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </>
                            )}
                            {viewModal.permit.status && viewModal.permit.status.toLowerCase() === 'approved' && (
                                <div className="px-4 py-2 bg-green-100 text-green-800 rounded font-semibold flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Already Approved
                                </div>
                            )}
                            {viewModal.permit.status && viewModal.permit.status.toLowerCase() === 'rejected' && (
                                <div className="px-4 py-2 bg-red-100 text-red-800 rounded font-semibold flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    Already Rejected
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            {approveModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Set Permit Validity</h3>

                        <label className="text-sm text-gray-700">Start Date</label>
                        <input
                            type="date"
                            value={approveModal.start ?? ''}
                            onChange={e => {
                                const newStart = e.target.value;
                                const newEnd = new Date(newStart);
                                newEnd.setFullYear(newEnd.getFullYear() + 1);
                                setApproveModal(prev => ({
                                    ...prev,
                                    start: newStart,
                                    end: newEnd.toISOString().split('T')[0]
                                }));
                            }}
                            className="w-full px-3 py-2 border rounded mb-3 text-black"
                        />

                        <label className="text-sm text-gray-700">End Date</label>
                        <input
                            type="date"
                            value={approveModal.end ?? ''}
                            onChange={(e) => setApproveModal(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-3 py-2 border rounded mb-4 text-black"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setApproveModal({ open: false })}
                                className="px-4 py-2 bg-gray-200 rounded text-black hover:bg-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={finalizeApproval}
                                className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700 transition-all"
                            >
                                Confirm Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
