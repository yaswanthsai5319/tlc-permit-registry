"use client";
import React, { useState, useEffect } from "react";
import { Settings, Edit, Trash2, Plus, Scale, ChevronDown, ChevronUp } from "lucide-react";
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
    const [governanceControls, setGovernanceControls] = useState({
        driverCapsPerBase: 500,
        vehicleCapsPerBase: 400,
        pairingCapsPerBase: 300,
        renewalTimelineDays: 30,
        minActiveDaysPerMonth: 15,
        maxViolationsBeforeSuspension: 3,
        complianceThreshold: 85
    });
    const [editingGovernance, setEditingGovernance] = useState(null);

    // Entity Creation State
    const [baseForm, setBaseForm] = useState({ baseNo: '', baseName: '', borough: 'Manhattan', status: 'ACTIVE' });
    const [driverForm, setDriverForm] = useState({ driverName: '', licenseNo: '', licenseExpiry: '', status: 'Active', baseNo: '' });
    const [vehicleForm, setVehicleForm] = useState({ vehiclePlate: '', vehicleVin: '', vehicleMake: '', vehicleModel: '', vehicleYear: '', insuranceExpiry: '', baseNo: '' });
    const [entityError, setEntityError] = useState('');
    const [entitySuccess, setEntitySuccess] = useState('');

    // UI State for dropdowns
    const [expanded, setExpanded] = useState({ statusCodes: false, jurisdiction: false, governance: false, createBase: false, createDriver: false, createVehicle: false });
    const toggleExpand = (section) => setExpanded(prev => ({ ...prev, [section]: !prev[section] }));

    // Load from localStorage on mount
    useEffect(() => {
        const cfg = storage.get('adminConfig');
        if (cfg) {
            if (Array.isArray(cfg.statusCodes)) setStatusCodes(cfg.statusCodes);
            if (Array.isArray(cfg.boroughRules)) setBoroughRules(cfg.boroughRules);
            if (cfg.governanceControls) setGovernanceControls(cfg.governanceControls);
        }
    }, []);

    const saveConfig = (next) => {
        const cfg = {
            statusCodes: statusCodes,
            boroughRules: boroughRules,
            governanceControls: governanceControls,
            ...(next || {})
        };
        storage.set('adminConfig', cfg);
        if (next) {
            if (next.statusCodes) setStatusCodes(next.statusCodes);
            if (next.boroughRules) setBoroughRules(next.boroughRules);
            if (next.governanceControls) setGovernanceControls(next.governanceControls);
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
    const handleUpdateGovernance = (field, value) => {
        const updated = { ...governanceControls, [field]: Number(value) };
        setGovernanceControls(updated);
        saveConfig({ governanceControls: updated });
        setEditingGovernance(null);
    };

    // Entity Creation Handlers
    const handleCreateBase = () => {
        setEntityError('');
        setEntitySuccess('');

        if (!baseForm.baseNo || !baseForm.baseName) {
            setEntityError('Base Number and Name are required');
            return;
        }

        const permits = storage.get('permits') || [];
        const exists = permits.some(p => p.baseNo === baseForm.baseNo);
        if (exists) {
            setEntityError('Base Number already exists');
            return;
        }

        const newBase = {
            id: `BASE-${Date.now()}`,
            type: 'Base',
            baseNo: baseForm.baseNo,
            baseName: baseForm.baseName,
            borough: baseForm.borough,
            status: baseForm.status,
            createdAt: new Date().toISOString()
        };

        storage.set('permits', [...permits, newBase]);
        setEntitySuccess(`Base ${baseForm.baseNo} created successfully!`);
        setBaseForm({ baseNo: '', baseName: '', borough: 'Manhattan', status: 'ACTIVE' });
    };

    const handleCreateDriver = () => {
        setEntityError('');
        setEntitySuccess('');

        if (!driverForm.driverName || !driverForm.licenseNo || !driverForm.licenseExpiry) {
            setEntityError('Driver Name, License Number, and Expiry are required');
            return;
        }

        const permits = storage.get('permits') || [];
        const exists = permits.some(p => p.licenseNo === driverForm.licenseNo);
        if (exists) {
            setEntityError('License Number already exists');
            return;
        }

        const newDriver = {
            id: `PERMIT-D-${Date.now()}`,
            type: 'Driver',
            driverName: driverForm.driverName,
            licenseNo: driverForm.licenseNo,
            licenseExpiry: driverForm.licenseExpiry,
            status: driverForm.status,
            baseNo: driverForm.baseNo || null,
            driverSuspended: false,
            outstandingViolations: 0,
            createdAt: new Date().toISOString()
        };

        storage.set('permits', [...permits, newDriver]);
        setEntitySuccess(`Driver ${driverForm.driverName} created successfully!`);
        setDriverForm({ driverName: '', licenseNo: '', licenseExpiry: '', status: 'Active', baseNo: '' });
    };

    const handleCreateVehicle = () => {
        setEntityError('');
        setEntitySuccess('');

        if (!vehicleForm.vehiclePlate || !vehicleForm.vehicleVin || !vehicleForm.baseNo) {
            setEntityError('Plate, VIN, and Base are required');
            return;
        }

        const permits = storage.get('permits') || [];
        const plateExists = permits.some(p => p.vehiclePlate === vehicleForm.vehiclePlate);
        const vinExists = permits.some(p => p.vehicleVin === vehicleForm.vehicleVin);

        if (plateExists) {
            setEntityError('License Plate already exists');
            return;
        }
        if (vinExists) {
            setEntityError('VIN already exists');
            return;
        }

        const baseExists = permits.some(p => p.type === 'Base' && p.baseNo === vehicleForm.baseNo);
        if (!baseExists) {
            setEntityError('Selected Base does not exist');
            return;
        }

        const newVehicle = {
            id: `PERMIT-V-${Date.now()}`,
            type: 'Vehicle',
            vehiclePlate: vehicleForm.vehiclePlate,
            vehicleVin: vehicleForm.vehicleVin,
            vehicleMake: vehicleForm.vehicleMake,
            vehicleModel: vehicleForm.vehicleModel,
            vehicleYear: vehicleForm.vehicleYear,
            insuranceExpiry: vehicleForm.insuranceExpiry,
            baseNo: vehicleForm.baseNo,
            status: 'Active',
            createdAt: new Date().toISOString()
        };

        storage.set('permits', [...permits, newVehicle]);
        setEntitySuccess(`Vehicle ${vehicleForm.vehiclePlate} created successfully!`);
        setVehicleForm({ vehiclePlate: '', vehicleVin: '', vehicleMake: '', vehicleModel: '', vehicleYear: '', insuranceExpiry: '', baseNo: '' });
    };

    // Get existing bases for dropdown
    const existingBases = (storage.get('permits') || []).filter(p => p.type === 'Base');

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">

            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <Settings className="w-6 h-6 text-slate-700" />
                        <span className="font-bold text-slate-900 text-xl">Rules & Configuration</span>
                    </div>
                </nav>

                <main className="flex-1 p-6 md:p-12">
                    <div className="max-w-7xl mx-auto space-y-4">
                        {/* STATUS CODES */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleExpand('statusCodes')}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 rounded-lg">
                                        <Scale className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="font-bold text-base text-slate-900">Status Codes</span>
                                </div>
                                {expanded.statusCodes ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>

                            {expanded.statusCodes && (
                                <div className="px-4 pb-4">
                                    <ul className="mb-4 space-y-2">
                                        {statusCodes.map((code, idx) => (
                                            <li key={idx} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                                {editIdx === idx ? (
                                                    <>
                                                        <input
                                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <button
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); handleSaveEditStatus(idx); }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="flex-1 font-semibold text-slate-900">{code}</span>
                                                        <button
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); handleEditStatus(idx); }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteStatus(idx); }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex gap-3">
                                        <input
                                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                            placeholder="Add Status Code"
                                            value={newStatus}
                                            onChange={e => setNewStatus(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                                            onClick={(e) => { e.stopPropagation(); handleAddStatus(); }}
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* JURISDICTION RULES */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleExpand('jurisdiction')}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-green-100 rounded-lg">
                                        <Settings className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="font-bold text-base text-slate-900">Jurisdiction Rules</span>
                                </div>
                                {expanded.jurisdiction ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>

                            {expanded.jurisdiction && (
                                <div className="px-4 pb-4">
                                    <div className="overflow-x-auto mb-4">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Borough</th>
                                                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Max Utilization</th>
                                                    <th className="py-2 px-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {boroughRules.map((rule, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-2 px-3 font-medium text-slate-900">{rule.borough}</td>
                                                        <td className="py-2 px-3 text-slate-700">{rule.maxUtilization}</td>
                                                        <td className="py-2 px-3 text-right">
                                                            <button
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteBoroughRule(idx); }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex gap-3">
                                        <input
                                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                            placeholder="Borough"
                                            value={newBorough}
                                            onChange={e => setNewBorough(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <input
                                            className="w-32 px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                            placeholder="Max Utilization"
                                            type="number"
                                            value={newLimit}
                                            onChange={e => setNewLimit(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md flex items-center gap-2"
                                            onClick={(e) => { e.stopPropagation(); handleAddBoroughRule(); }}
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* GOVERNANCE CONTROLS */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleExpand('governance')}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-100 rounded-lg">
                                        <Settings className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <span className="font-bold text-base text-slate-900">Governance Controls</span>
                                </div>
                                {expanded.governance ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>

                            {expanded.governance && (
                                <div className="px-4 pb-4">
                                    <div className="space-y-6">
                                        {/* Caps Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="text-sm font-semibold text-slate-600 mb-2">Driver Cap (Per Base)</div>
                                                {editingGovernance === 'driverCapsPerBase' ? (
                                                    <input
                                                        type="number"
                                                        autoFocus
                                                        className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none"
                                                        defaultValue={governanceControls.driverCapsPerBase}
                                                        onBlur={(e) => handleUpdateGovernance('driverCapsPerBase', e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateGovernance('driverCapsPerBase', e.currentTarget.value)}
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => setEditingGovernance('driverCapsPerBase')}
                                                        className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 flex items-center gap-2"
                                                    >
                                                        {governanceControls.driverCapsPerBase}
                                                        <span className="text-xs font-normal text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">Edit</span>
                                                    </div>
                                                )}
                                                <div className="text-xs text-slate-500 mt-1">Max active drivers allowed per base</div>
                                            </div>

                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="text-sm font-semibold text-slate-600 mb-2">Vehicle Cap (Per Base)</div>
                                                {editingGovernance === 'vehicleCapsPerBase' ? (
                                                    <input
                                                        type="number"
                                                        autoFocus
                                                        className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none"
                                                        defaultValue={governanceControls.vehicleCapsPerBase}
                                                        onBlur={(e) => handleUpdateGovernance('vehicleCapsPerBase', e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateGovernance('vehicleCapsPerBase', e.currentTarget.value)}
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => setEditingGovernance('vehicleCapsPerBase')}
                                                        className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 flex items-center gap-2"
                                                    >
                                                        {governanceControls.vehicleCapsPerBase}
                                                        <span className="text-xs font-normal text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">Edit</span>
                                                    </div>
                                                )}
                                                <div className="text-xs text-slate-500 mt-1">Max active vehicles allowed per base</div>
                                            </div>

                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="text-sm font-semibold text-slate-600 mb-2">Pairing Cap (Per Base)</div>
                                                {editingGovernance === 'pairingCapsPerBase' ? (
                                                    <input
                                                        type="number"
                                                        autoFocus
                                                        className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none"
                                                        defaultValue={governanceControls.pairingCapsPerBase}
                                                        onBlur={(e) => handleUpdateGovernance('pairingCapsPerBase', e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateGovernance('pairingCapsPerBase', e.currentTarget.value)}
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => setEditingGovernance('pairingCapsPerBase')}
                                                        className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 flex items-center gap-2"
                                                    >
                                                        {governanceControls.pairingCapsPerBase}
                                                        <span className="text-xs font-normal text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">Edit</span>
                                                    </div>
                                                )}
                                                <div className="text-xs text-slate-500 mt-1">Max simultaneous pairings per base</div>
                                            </div>
                                        </div>

                                        {/* Thresholds Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="text-sm font-semibold text-slate-600 mb-2">Renewal Timeline</div>
                                                {editingGovernance === 'renewalTimelineDays' ? (
                                                    <input
                                                        type="number"
                                                        autoFocus
                                                        className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none"
                                                        defaultValue={governanceControls.renewalTimelineDays}
                                                        onBlur={(e) => handleUpdateGovernance('renewalTimelineDays', e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateGovernance('renewalTimelineDays', e.currentTarget.value)}
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => setEditingGovernance('renewalTimelineDays')}
                                                        className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 flex items-center gap-2"
                                                    >
                                                        {governanceControls.renewalTimelineDays} <span className="text-sm font-normal text-slate-500">days</span>
                                                    </div>
                                                )}
                                                <div className="text-xs text-slate-500 mt-1">Days before expiry to allow renewal</div>
                                            </div>

                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="text-sm font-semibold text-slate-600 mb-2">Min Active Days</div>
                                                {editingGovernance === 'minActiveDaysPerMonth' ? (
                                                    <input
                                                        type="number"
                                                        autoFocus
                                                        className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none"
                                                        defaultValue={governanceControls.minActiveDaysPerMonth}
                                                        onBlur={(e) => handleUpdateGovernance('minActiveDaysPerMonth', e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateGovernance('minActiveDaysPerMonth', e.currentTarget.value)}
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => setEditingGovernance('minActiveDaysPerMonth')}
                                                        className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 flex items-center gap-2"
                                                    >
                                                        {governanceControls.minActiveDaysPerMonth} <span className="text-sm font-normal text-slate-500">days/mo</span>
                                                    </div>
                                                )}
                                                <div className="text-xs text-slate-500 mt-1">Minimum activity for compliance</div>
                                            </div>

                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="text-sm font-semibold text-slate-600 mb-2">Max Violations</div>
                                                {editingGovernance === 'maxViolationsBeforeSuspension' ? (
                                                    <input
                                                        type="number"
                                                        autoFocus
                                                        className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none"
                                                        defaultValue={governanceControls.maxViolationsBeforeSuspension}
                                                        onBlur={(e) => handleUpdateGovernance('maxViolationsBeforeSuspension', e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateGovernance('maxViolationsBeforeSuspension', e.currentTarget.value)}
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => setEditingGovernance('maxViolationsBeforeSuspension')}
                                                        className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 flex items-center gap-2"
                                                    >
                                                        {governanceControls.maxViolationsBeforeSuspension}
                                                        <span className="text-xs font-normal text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">Edit</span>
                                                    </div>
                                                )}
                                                <div className="text-xs text-slate-500 mt-1">Threshold for auto-suspension</div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="text-sm font-semibold text-slate-600 mb-2">Compliance Threshold</div>
                                            {editingGovernance === 'complianceThreshold' ? (
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none"
                                                    defaultValue={governanceControls.complianceThreshold}
                                                    onBlur={(e) => handleUpdateGovernance('complianceThreshold', e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateGovernance('complianceThreshold', e.currentTarget.value)}
                                                />
                                            ) : (
                                                <div
                                                    onClick={() => setEditingGovernance('complianceThreshold')}
                                                    className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-blue-600 flex items-center gap-2"
                                                >
                                                    {governanceControls.complianceThreshold}%
                                                    <span className="text-xs font-normal text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">Edit</span>
                                                </div>
                                            )}
                                            <div className="text-xs text-slate-500 mt-1">Minimum score required for good standing</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CREATE BASE */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleExpand('createBase')}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                                        <Plus className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="font-bold text-base text-slate-900">Create Base (Fleet Owner)</span>
                                </div>
                                {expanded.createBase ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>

                            {expanded.createBase && (
                                <div className="px-4 pb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Base Number *</label>
                                            <input
                                                type="text"
                                                value={baseForm.baseNo}
                                                onChange={(e) => setBaseForm({ ...baseForm, baseNo: e.target.value })}
                                                placeholder="B12345"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Base Name *</label>
                                            <input
                                                type="text"
                                                value={baseForm.baseName}
                                                onChange={(e) => setBaseForm({ ...baseForm, baseName: e.target.value })}
                                                placeholder="XYZ Fleet"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Borough</label>
                                            <select
                                                value={baseForm.borough}
                                                onChange={(e) => setBaseForm({ ...baseForm, borough: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            >
                                                <option value="Manhattan">Manhattan</option>
                                                <option value="Brooklyn">Brooklyn</option>
                                                <option value="Queens">Queens</option>
                                                <option value="Bronx">Bronx</option>
                                                <option value="Staten Island">Staten Island</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                                            <select
                                                value={baseForm.status}
                                                onChange={(e) => setBaseForm({ ...baseForm, status: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            >
                                                <option value="ACTIVE">ACTIVE</option>
                                                <option value="SUSPENDED">SUSPENDED</option>
                                                <option value="REVOKED">REVOKED</option>
                                                <option value="EXPIRED">EXPIRED</option>
                                                <option value="PENDING">PENDING</option>
                                            </select>
                                        </div>
                                    </div>
                                    {entityError && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{entityError}</div>}
                                    {entitySuccess && <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">{entitySuccess}</div>}
                                    <button onClick={handleCreateBase} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Create Base
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* CREATE DRIVER */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleExpand('createDriver')}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 rounded-lg">
                                        <Plus className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="font-bold text-base text-slate-900">Create Driver</span>
                                </div>
                                {expanded.createDriver ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>

                            {expanded.createDriver && (
                                <div className="px-4 pb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Driver Name *</label>
                                            <input
                                                type="text"
                                                value={driverForm.driverName}
                                                onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                                                placeholder="John Doe"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">License Number *</label>
                                            <input
                                                type="text"
                                                value={driverForm.licenseNo}
                                                onChange={(e) => setDriverForm({ ...driverForm, licenseNo: e.target.value })}
                                                placeholder="D123456"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">License Expiry *</label>
                                            <input
                                                type="date"
                                                value={driverForm.licenseExpiry}
                                                onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                                            <select
                                                value={driverForm.status}
                                                onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Suspended">Suspended</option>
                                                <option value="Revoked">Revoked</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Base Affiliation (Optional)</label>
                                            <select
                                                value={driverForm.baseNo}
                                                onChange={(e) => setDriverForm({ ...driverForm, baseNo: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            >
                                                <option value="">No Affiliation</option>
                                                {existingBases.map(base => (
                                                    <option key={base.baseNo} value={base.baseNo}>{base.baseNo} - {base.baseName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {entityError && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{entityError}</div>}
                                    {entitySuccess && <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">{entitySuccess}</div>}
                                    <button onClick={handleCreateDriver} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Create Driver
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* CREATE VEHICLE */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleExpand('createVehicle')}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-100 rounded-lg">
                                        <Plus className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <span className="font-bold text-base text-slate-900">Create Vehicle</span>
                                </div>
                                {expanded.createVehicle ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </div>

                            {expanded.createVehicle && (
                                <div className="px-4 pb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">License Plate *</label>
                                            <input
                                                type="text"
                                                value={vehicleForm.vehiclePlate}
                                                onChange={(e) => setVehicleForm({ ...vehicleForm, vehiclePlate: e.target.value })}
                                                placeholder="ABC1234"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">VIN *</label>
                                            <input
                                                type="text"
                                                value={vehicleForm.vehicleVin}
                                                onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleVin: e.target.value })}
                                                placeholder="1HGBH41JXMN109186"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Make</label>
                                            <input
                                                type="text"
                                                value={vehicleForm.vehicleMake}
                                                onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleMake: e.target.value })}
                                                placeholder="Toyota"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Model</label>
                                            <input
                                                type="text"
                                                value={vehicleForm.vehicleModel}
                                                onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleModel: e.target.value })}
                                                placeholder="Camry"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Year</label>
                                            <input
                                                type="number"
                                                value={vehicleForm.vehicleYear}
                                                onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleYear: e.target.value })}
                                                placeholder="2020"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Insurance Expiry</label>
                                            <input
                                                type="date"
                                                value={vehicleForm.insuranceExpiry}
                                                onChange={(e) => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Base Affiliation *</label>
                                            <select
                                                value={vehicleForm.baseNo}
                                                onChange={(e) => setVehicleForm({ ...vehicleForm, baseNo: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900"
                                            >
                                                <option value="">Select Base</option>
                                                {existingBases.map(base => (
                                                    <option key={base.baseNo} value={base.baseNo}>{base.baseNo} - {base.baseName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {entityError && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{entityError}</div>}
                                    {entitySuccess && <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">{entitySuccess}</div>}
                                    <button onClick={handleCreateVehicle} className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Create Vehicle
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
