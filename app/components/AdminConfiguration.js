"use client";
import React, { useState, useEffect } from "react";
import { Settings, Edit, Trash2, Plus, Scale } from "lucide-react";
import { storage } from '@/app/utils/storage';

export default function AdminConfiguration() {
    // Status Codes - load default from localStorage adminConfig
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

    // Load from localStorage on mount
    useEffect(() => {
        const cfg = storage.get('adminConfig');
        if (cfg) {
            if (Array.isArray(cfg.statusCodes)) setStatusCodes(cfg.statusCodes);
            if (Array.isArray(cfg.boroughRules)) setBoroughRules(cfg.boroughRules);
            if (typeof cfg.complianceThreshold === 'number') setComplianceThreshold(cfg.complianceThreshold);
        }
    }, []);

    const saveConfig = (next) => {
        const cfg = {
            statusCodes: statusCodes,
            boroughRules: boroughRules,
            complianceThreshold: complianceThreshold,
            ...(next || {})
        };
        storage.set('adminConfig', cfg);
        // update local copies if next contains updates
        if (next) {
            if (next.statusCodes) setStatusCodes(next.statusCodes);
            if (next.boroughRules) setBoroughRules(next.boroughRules);
            if (typeof next.complianceThreshold === 'number') setComplianceThreshold(next.complianceThreshold);
        }
    };

    // Status Codes handlers
    const handleAddStatus = () => {
        if (newStatus && !statusCodes.includes(newStatus)) {
            const updated = [...statusCodes, newStatus];
            setStatusCodes(updated);
            setNewStatus("");
            saveConfig({ statusCodes: updated });
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
        saveConfig({ statusCodes: updated });
    };
    const handleDeleteStatus = idx => {
        const updated = statusCodes.filter((_, i) => i !== idx);
        setStatusCodes(updated);
        saveConfig({ statusCodes: updated });
    };

    // Borough Rules handlers
    const handleAddBoroughRule = () => {
        if (newBorough && newLimit) {
            const updated = [...boroughRules, { borough: newBorough, maxUtilization: Number(newLimit) }];
            setBoroughRules(updated);
            setNewBorough("");
            setNewLimit("");
            saveConfig({ boroughRules: updated });
        }
    };
    const handleDeleteBoroughRule = idx => {
        const updated = boroughRules.filter((_, i) => i !== idx);
        setBoroughRules(updated);
        saveConfig({ boroughRules: updated });
    };

    // Governance Controls handlers
    const handleSaveThreshold = () => {
        setEditThreshold(false);
        saveConfig({ complianceThreshold });
    };

    const handleResetDefaults = () => {
        const defaults = {
            statusCodes: ["ACTIVE", "SUSPENDED"],
            boroughRules: [
                { borough: "Manhattan", maxUtilization: 120 },
                { borough: "Brooklyn", maxUtilization: 100 },
            ],
            complianceThreshold: 85
        };
        setStatusCodes(defaults.statusCodes);
        setBoroughRules(defaults.boroughRules);
        setComplianceThreshold(defaults.complianceThreshold);
        saveConfig(defaults);
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">

            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <Settings className="w-6 h-6 text-slate-700" />
                        <span className="font-bold text-slate-900 text-xl">Rules & Configuration</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                            onClick={handleResetDefaults}
                        >
                            Reset Defaults
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-md"
                            onClick={() => saveConfig()}
                        >
                            Save All
                        </button>
                    </div>
                </nav>

                <main className="flex-1 p-6 md:p-12">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* STATUS CODES */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Scale className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="font-bold text-xl text-slate-900">Status Codes</span>
                            </div>
                            <ul className="mb-6 space-y-3">
                                {statusCodes.map((code, idx) => (
                                    <li key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        {editIdx === idx ? (
                                            <>
                                                <input
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                />
                                                <button
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    onClick={() => handleSaveEditStatus(idx)}
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex-1 font-semibold text-slate-900">{code}</span>
                                                <button
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    onClick={() => handleEditStatus(idx)}
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            onClick={() => handleDeleteStatus(idx)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-3">
                                <input
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                    placeholder="Add Status Code"
                                    value={newStatus}
                                    onChange={e => setNewStatus(e.target.value)}
                                />
                                <button
                                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                                    onClick={handleAddStatus}
                                >
                                    <Plus className="w-5 h-5" /> Add
                                </button>
                            </div>
                        </div>

                        {/* JURISDICTION RULES */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <Scale className="w-6 h-6 text-emerald-600" />
                                </div>
                                <span className="font-bold text-xl text-slate-900">Jurisdiction Rules</span>
                            </div>
                            <div className="overflow-x-auto mb-6">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Borough</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Max Utilization</th>
                                            <th className="py-3 px-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {boroughRules.map((rule, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-slate-900">{rule.borough}</td>
                                                <td className="py-3 px-4 text-slate-700">{rule.maxUtilization}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        onClick={() => handleDeleteBoroughRule(idx)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex gap-3">
                                <input
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                    placeholder="Borough"
                                    value={newBorough}
                                    onChange={e => setNewBorough(e.target.value)}
                                />
                                <input
                                    className="w-40 px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                    placeholder="Max Utilization"
                                    type="number"
                                    value={newLimit}
                                    onChange={e => setNewLimit(e.target.value)}
                                />
                                <button
                                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
                                    onClick={handleAddBoroughRule}
                                >
                                    <Plus className="w-5 h-5" /> Add
                                </button>
                            </div>
                        </div>

                        {/* GOVERNANCE CONTROLS */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Scale className="w-6 h-6 text-indigo-600" />
                                </div>
                                <span className="font-bold text-xl text-slate-900">Governance Controls</span>
                            </div>
                            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <span className="font-medium text-slate-700">Compliance Thresholds:</span>
                                {editThreshold ? (
                                    <>
                                        <input
                                            className="w-24 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                            type="number"
                                            value={complianceThreshold}
                                            onChange={e => setComplianceThreshold(Number(e.target.value))}
                                        />
                                        <button
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md"
                                            onClick={handleSaveThreshold}
                                        >
                                            Save
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="font-bold text-slate-900 text-lg">{complianceThreshold}%</span>
                                        <button
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            onClick={() => setEditThreshold(true)}
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </div>
                            <div>
                                <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md">
                                    Edit Cap Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
