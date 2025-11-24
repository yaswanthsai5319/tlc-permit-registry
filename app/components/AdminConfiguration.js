import React, { useState } from "react";
import { Settings, Edit, Trash2, Plus, Scale } from "lucide-react";

export default function AdminConfiguration() {
    // Status Codes
    const [statusCodes, setStatusCodes] = useState(["ACTIVE", "SUSPENDED"]);
    const [newStatus, setNewStatus] = useState("");
    const [editIdx, setEditIdx] = useState(null);
    const [editValue, setEditValue] = useState("");

    // Borough Rules
    const [boroughRules, setBoroughRules] = useState([
        { borough: "Manhattan", maxUtilization: 120 },
        { borough: "Brooklyn", maxUtilization: 100 },
    ]);
    const [newBorough, setNewBorough] = useState("");
    const [newLimit, setNewLimit] = useState("");

    // Governance Controls
    const [complianceThreshold, setComplianceThreshold] = useState(85);
    const [editThreshold, setEditThreshold] = useState(false);

    // Status Codes handlers
    const handleAddStatus = () => {
        if (newStatus && !statusCodes.includes(newStatus)) {
            setStatusCodes([...statusCodes, newStatus]);
            setNewStatus("");
        }
    };
    const handleEditStatus = idx => {
        setEditIdx(idx);
        setEditValue(statusCodes[idx]);
    };
    const handleSaveEditStatus = idx => {
        const updated = [...statusCodes];
        updated[idx] = editValue;
        setStatusCodes(updated);
        setEditIdx(null);
        setEditValue("");
    };
    const handleDeleteStatus = idx => {
        setStatusCodes(statusCodes.filter((_, i) => i !== idx));
    };

    // Borough Rules handlers
    const handleAddBoroughRule = () => {
        if (newBorough && newLimit) {
            setBoroughRules([...boroughRules, { borough: newBorough, maxUtilization: Number(newLimit) }]);
            setNewBorough("");
            setNewLimit("");
        }
    };
    const handleDeleteBoroughRule = idx => {
        setBoroughRules(boroughRules.filter((_, i) => i !== idx));
    };

    // Governance Controls handlers
    const handleSaveThreshold = () => {
        setEditThreshold(false);
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">

            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-end">
                    <span className="font-bold text-blue-700">Admin / Rules & Configuration</span>
                </nav>
                {/* HEADER */}
                <header className="bg-white shadow flex items-center gap-4 px-8 py-6">
                    <Settings className="w-8 h-8 text-indigo-600" />
                    <div className="text-xl font-bold">Rules Configuration</div>
                </header>
                <main className="flex-1 p-8 space-y-8">
                    {/* STATUS CODES */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Scale className="w-6 h-6 text-blue-500" />
                            <span className="font-bold text-lg">Status Codes</span>
                        </div>
                        <ul className="mb-4">
                            {statusCodes.map((code, idx) => (
                                <li key={idx} className="flex items-center gap-2 mb-2">
                                    {editIdx === idx ? (
                                        <>
                                            <input
                                                className="border rounded px-2 py-1"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                            />
                                            <button className="text-green-600" onClick={() => handleSaveEditStatus(idx)}>
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-semibold">{code}</span>
                                            <button className="text-blue-600" onClick={() => handleEditStatus(idx)}>
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    <button className="text-red-600" onClick={() => handleDeleteStatus(idx)}>
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2">
                            <input
                                className="border rounded px-2 py-1"
                                placeholder="Add Status Code"
                                value={newStatus}
                                onChange={e => setNewStatus(e.target.value)}
                            />
                            <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleAddStatus}>
                                <Plus className="w-4 h-4 inline" /> Add
                            </button>
                        </div>
                    </div>
                    {/* JURISDICTION RULES */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Scale className="w-6 h-6 text-green-500" />
                            <span className="font-bold text-lg">Jurisdiction Rules</span>
                        </div>
                        <table className="w-full mb-4">
                            <thead>
                            <tr>
                                <th className="text-left py-1">Borough</th>
                                <th className="text-left py-1">Max Utilization</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {boroughRules.map((rule, idx) => (
                                <tr key={idx}>
                                    <td className="py-1">{rule.borough}</td>
                                    <td className="py-1">{rule.maxUtilization}</td>
                                    <td>
                                        <button className="text-red-600" onClick={() => handleDeleteBoroughRule(idx)}>
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div className="flex gap-2">
                            <input
                                className="border rounded px-2 py-1"
                                placeholder="Borough"
                                value={newBorough}
                                onChange={e => setNewBorough(e.target.value)}
                            />
                            <input
                                className="border rounded px-2 py-1"
                                placeholder="Max Utilization"
                                type="number"
                                value={newLimit}
                                onChange={e => setNewLimit(e.target.value)}
                            />
                            <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleAddBoroughRule}>
                                <Plus className="w-4 h-4 inline" /> Add
                            </button>
                        </div>
                    </div>
                    {/* GOVERNANCE CONTROLS */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Scale className="w-6 h-6 text-indigo-500" />
                            <span className="font-bold text-lg">Governance Controls</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Compliance Thresholds:</span>
                            {editThreshold ? (
                                <>
                                    <input
                                        className="border rounded px-2 py-1 w-20"
                                        type="number"
                                        value={complianceThreshold}
                                        onChange={e => setComplianceThreshold(Number(e.target.value))}
                                    />
                                    <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleSaveThreshold}>
                                        Save
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="font-semibold">{complianceThreshold}%</span>
                                    <button className="text-blue-600" onClick={() => setEditThreshold(true)}>
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="mt-4">
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded">Edit Cap Settings</button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
