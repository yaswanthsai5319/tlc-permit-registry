import React, { useState, useEffect } from "react";

const permitTypes = [
    { value: "", label: "All Types" },
    { value: "Vehicle", label: "Vehicle" },
    { value: "Driver", label: "Driver" },
    { value: "Base", label: "Base" },
];

const mockExpiringPermits = [
    { type: "Vehicle", permitNo: "V12345", expiry: "2024-07-10", status: "ACTIVE" },
    { type: "Driver", permitNo: "D67890", expiry: "2024-07-08", status: "EXPIRED" },
    { type: "Base", permitNo: "B54321", expiry: "2024-07-12", status: "SUSPENDED" },
];

export default function ExpiringSoonSection({ onBack }) {
    const [type, setType] = useState("");
    const [permitNo, setPermitNo] = useState("");
    const [filtered, setFiltered] = useState(mockExpiringPermits);

    useEffect(() => {
        setFiltered(
            mockExpiringPermits.filter((permit) => {
                const typeMatch = !type || permit.type === type;
                const noMatch =
                    !permitNo ||
                    permit.permitNo.toLowerCase().includes(permitNo.toLowerCase());
                return typeMatch && noMatch;
            })
        );
    }, [type, permitNo]);

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
                                No permits found.
                            </td>
                        </tr>
                    ) : (
                        filtered.map((permit, idx) => (
                            <tr
                                key={idx}
                                className={`${
                                    idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                                } hover:bg-blue-50 transition`}
                            >
                                <td className="py-3 px-6 rounded-l-xl">{permit.type}</td>
                                <td className="py-3 px-6">{permit.permitNo}</td>
                                <td className="py-3 px-6">{permit.expiry}</td>
                                <td className="py-3 px-6 rounded-r-xl">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                            permit.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : permit.status === "EXPIRED"
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
