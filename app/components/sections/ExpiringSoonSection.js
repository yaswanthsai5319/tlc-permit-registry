import React, { useState, useEffect } from "react";
import { storage } from '@/app/utils/storage';

const permitTypes = [
    { value: "", label: "All Types" },
    { value: "Vehicle", label: "Vehicle" },
    { value: "Driver", label: "Driver" },
    { value: "Base", label: "Base" },
];

export default function ExpiringSoonSection({ onBack }) {
    const [type, setType] = useState("");
    const [permitNo, setPermitNo] = useState("");
    const [permits, setPermits] = useState([]);
    const [expiringPermits, setExpiringPermits] = useState([]);
    const [filtered, setFiltered] = useState([]);

    // Load permits from localStorage
    useEffect(() => {
        const stored = storage.get('permits') || [];
        setPermits(stored);
    }, []);

    // Calculate expiring permits (within 30 days)
    useEffect(() => {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const expiring = [];

        permits.forEach(permit => {
            // Check license expiry
            if (permit.licenseExpiry) {
                const expiryDate = new Date(permit.licenseExpiry);
                if (expiryDate >= now && expiryDate <= thirtyDaysFromNow) {
                    expiring.push({
                        type: "Driver",
                        permitNo: permit.licenseNo || permit.id,
                        expiry: permit.licenseExpiry,
                        status: permit.status ? permit.status.toUpperCase() : "PENDING",
                        permitId: permit.id
                    });
                }
            }

            // Check insurance expiry
            if (permit.insuranceExpiry) {
                const expiryDate = new Date(permit.insuranceExpiry);
                if (expiryDate >= now && expiryDate <= thirtyDaysFromNow) {
                    expiring.push({
                        type: "Vehicle",
                        permitNo: permit.vehiclePlate || permit.id,
                        expiry: permit.insuranceExpiry,
                        status: permit.status ? permit.status.toUpperCase() : "PENDING",
                        permitId: permit.id
                    });
                }
            }

            // Check if permit has schedule with end date
            if (Array.isArray(permit.schedule) && permit.schedule.length > 0) {
                const lastSchedule = permit.schedule[permit.schedule.length - 1];
                if (lastSchedule.date) {
                    const scheduleEndDate = new Date(lastSchedule.date);
                    if (scheduleEndDate >= now && scheduleEndDate <= thirtyDaysFromNow) {
                        expiring.push({
                            type: "Base",
                            permitNo: permit.baseNo || permit.id,
                            expiry: lastSchedule.date,
                            status: permit.status ? permit.status.toUpperCase() : "PENDING",
                            permitId: permit.id
                        });
                    }
                }
            }
        });

        setExpiringPermits(expiring);
    }, [permits]);

    // Apply filters
    useEffect(() => {
        setFiltered(
            expiringPermits.filter((permit) => {
                const typeMatch = !type || permit.type === type;
                const noMatch =
                    !permitNo ||
                    permit.permitNo.toLowerCase().includes(permitNo.toLowerCase());
                return typeMatch && noMatch;
            })
        );
    }, [type, permitNo, expiringPermits]);

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl mt-4">
            <button
                onClick={onBack}
                className="text-blue-600 mb-4 hover:underline font-semibold"
            >
                ← Back to Dashboard
            </button>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Expiring Soon Permits
            </h2>
            <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500"
                >
                    {permitTypes.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                            {pt.label}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    value={permitNo}
                    onChange={(e) => setPermitNo(e.target.value)}
                    placeholder="Permit No."
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-xl shadow border border-gray-200">
                    <thead>
                        <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                            <th className="py-3 px-6 text-left font-semibold text-gray-700">Permit Type</th>
                            <th className="py-3 px-6 text-left font-semibold text-gray-700">Permit No.</th>
                            <th className="py-3 px-6 text-left font-semibold text-gray-700">Expiry Date</th>
                            <th className="py-3 px-6 text-left font-semibold text-gray-700">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-6 px-6 text-center text-gray-500">
                                    No permits expiring within 30 days.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((permit, idx) => (
                                <tr
                                    key={idx}
                                    className={`${idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                                        } hover:bg-blue-50 transition`}
                                >
                                    <td className="py-3 px-6 rounded-l-xl">{permit.type}</td>
                                    <td className="py-3 px-6">{permit.permitNo}</td>
                                    <td className="py-3 px-6">{new Date(permit.expiry).toLocaleDateString()}</td>
                                    <td className="py-3 px-6 rounded-r-xl">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${permit.status === "APPROVED" || permit.status === "ACTIVE"
                                                    ? "bg-green-100 text-green-700"
                                                    : permit.status === "EXPIRED"
                                                        ? "bg-red-100 text-red-700"
                                                        : permit.status === "SUSPENDED"
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-yellow-100 text-yellow-700"
                                                }`}
                                        >
                                            {permit.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
