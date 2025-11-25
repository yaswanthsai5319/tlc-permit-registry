"use client";
import React, { useState, useEffect, useMemo } from "react";
import { User, Car, Home, Calendar, CheckCircle, XCircle, Search } from "lucide-react";
import { storage } from '@/app/utils/storage';

const steps = [
    { label: "Select Driver", icon: <User className="w-5 h-5" /> },
    { label: "Select Vehicle", icon: <Car className="w-5 h-5" /> },
    { label: "Select Base", icon: <Home className="w-5 h-5" /> },
    { label: "Set Duration", icon: <Calendar className="w-5 h-5" /> },
];

export default function PairingWizard() {
    const [activeStep, setActiveStep] = useState(0);

    // Form state
    const [driver, setDriver] = useState({ license: "", name: "", status: "ACTIVE", expiry: "" });
    const [vehicle, setVehicle] = useState({ plate: "", vin: "", insurance: "" });
    const [base, setBase] = useState({ id: "", borough: "Manhattan", capValid: true });
    const [duration, setDuration] = useState({ start: "", end: "" });
    const [compliance, setCompliance] = useState({ passed: true, message: "All checks passed." });

    // load permits from localStorage and derive lists
    const [permits, setPermits] = useState([]);
    const [driverSearch, setDriverSearch] = useState("");
    const [vehicleSearch, setVehicleSearch] = useState("");
    const [baseSearch, setBaseSearch] = useState("");

    useEffect(() => {
        const stored = storage.get('permits') || [];
        setPermits(stored);
    }, []);

    const drivers = useMemo(() => {
        const map = new Map();
        permits.forEach(p => {
            if (p.licenseNo && !map.has(p.licenseNo)) {
                map.set(p.licenseNo, { licenseNo: p.licenseNo, name: p.driverName, licenseExpiry: p.licenseExpiry, status: p.driverSuspended ? 'SUSPENDED' : (p.status || 'N/A') });
            }
        });
        return Array.from(map.values());
    }, [permits]);

    const vehicles = useMemo(() => {
        const map = new Map();
        permits.forEach(p => {
            if (p.vehiclePlate && !map.has(p.vehiclePlate)) {
                map.set(p.vehiclePlate, { plate: p.vehiclePlate, vin: p.vehicleVin, model: `${p.vehicleMake || ''} ${p.vehicleModel || ''}`.trim(), insuranceExpiry: p.insuranceExpiry });
            }
        });
        return Array.from(map.values());
    }, [permits]);

    const bases = useMemo(() => {
        const map = new Map();
        permits.forEach(p => {
            if (p.baseNo && !map.has(p.baseNo)) {
                map.set(p.baseNo, { baseNo: p.baseNo, borough: p.borough });
            }
        });
        return Array.from(map.values());
    }, [permits]);

    // Step content
    const stepContent = [
        (
            <div className="space-y-4">
                <div className="font-bold text-lg mb-2">Step 1: Select Driver</div>
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        className="border rounded px-4 py-2 w-full"
                        placeholder="Search license no. or driver name"
                        value={driverSearch}
                        onChange={e => setDriverSearch(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {drivers.filter(d => d.licenseNo.toLowerCase().includes(driverSearch.toLowerCase()) || d.name.toLowerCase().includes(driverSearch.toLowerCase())).map(d => (
                        <button key={d.licenseNo} onClick={() => setDriver({ license: d.licenseNo, name: d.name, expiry: d.licenseExpiry, status: d.status })} className={`bg-white rounded border p-3 text-left shadow hover:shadow-lg transition ${driver.license === d.licenseNo ? 'ring-2 ring-indigo-400' : ''}`}>
                            <div className="font-semibold text-sm">{d.name}</div>
                            <div className="text-xs text-gray-500">{d.licenseNo} • Expiry: {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : 'N/A'}</div>
                        </button>
                    ))}
                </div>
                <div className="bg-white rounded shadow p-4 flex items-center gap-4">
                    <User className="w-6 h-6 text-indigo-600" />
                    <div>
                        <div className="font-semibold">Status: <span className={driver.status === "ACTIVE" ? "text-emerald-700" : "text-red-700"}>{driver.status}</span></div>
                        <div>Permit Expiry: <span className="font-semibold">{driver.expiry}</span></div>
                    </div>
                </div>
            </div>
        ),
        (
            <div className="space-y-4">
                <div className="font-bold text-lg mb-2">Step 2: Select Vehicle</div>
                <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input className="border rounded px-4 py-2 w-full" placeholder="Search plate or vin" value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {vehicles.filter(v => v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) || (v.vin || '').toLowerCase().includes(vehicleSearch.toLowerCase())).map(v => (
                        <button key={v.plate} onClick={() => setVehicle({ plate: v.plate, vin: v.vin, insurance: v.insuranceExpiry })} className={`bg-white rounded border p-3 text-left shadow hover:shadow-lg transition ${vehicle.plate === v.plate ? 'ring-2 ring-indigo-400' : ''}`}>
                            <div className="font-semibold text-sm">{v.plate}</div>
                            <div className="text-xs text-gray-500">{v.model} • VIN: {v.vin}</div>
                            <div className="text-xs text-gray-500">Insurance: {v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString() : 'N/A'}</div>
                        </button>
                    ))}
                </div>
                <div className="bg-white rounded shadow p-4 flex items-center gap-4">
                    <Car className="w-6 h-6 text-indigo-600" />
                    <div>
                        <div>Insurance Status: <span className={vehicle.insurance === "Valid" ? "text-emerald-700" : "text-red-700"}>{vehicle.insurance}</span></div>
                    </div>
                </div>
            </div>
        ),
        (
            <div className="space-y-4">
                <div className="font-bold text-lg mb-2">Step 3: Select Base</div>
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input className="border rounded px-4 py-2 w-full" placeholder="Search base no or borough" value={baseSearch} onChange={e => setBaseSearch(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bases.filter(b => b.baseNo.toLowerCase().includes(baseSearch.toLowerCase()) || (b.borough || '').toLowerCase().includes(baseSearch.toLowerCase())).map(b => (
                        <button key={b.baseNo} onClick={() => setBase({ id: b.baseNo, borough: b.borough, capValid: true })} className={`bg-white rounded border p-3 text-left shadow hover:shadow-lg transition ${base.id === b.baseNo ? 'ring-2 ring-emerald-400' : ''}`}>
                            <div className="font-semibold text-sm">{b.baseNo}</div>
                            <div className="text-xs text-gray-500">{b.borough}</div>
                        </button>
                    ))}
                </div>
                <div className="bg-white rounded shadow p-4 flex items-center gap-4">
                    <Home className="w-6 h-6 text-emerald-500" />
                    <div>
                        <div>Borough: <span className="font-semibold">{base.borough}</span></div>
                        <div>
                            Permit Cap Validation: {base.capValid
                                ? <span className="flex items-center text-emerald-700"><CheckCircle className="w-4 h-4 mr-1" /> Valid</span>
                                : <span className="flex items-center text-red-700"><XCircle className="w-4 h-4 mr-1" /> Exceeded</span>
                            }
                        </div>
                    </div>
                </div>
            </div>
        ),
        (
            <div className="space-y-4">
                <div className="font-bold text-lg mb-2">Step 4: Set Duration</div>
                <div className="flex gap-4">
                    <input
                        type="datetime-local"
                        className="border rounded px-4 py-2"
                        value={duration.start}
                        onChange={e => setDuration({ ...duration, start: e.target.value })}
                    />
                    <input
                        type="datetime-local"
                        className="border rounded px-4 py-2"
                        value={duration.end}
                        onChange={e => setDuration({ ...duration, end: e.target.value })}
                    />
                </div>
                <div className="bg-white rounded shadow p-4 flex items-center gap-4">
                    {compliance.passed
                        ? <CheckCircle className="w-6 h-6 text-emerald-500" />
                        : <XCircle className="w-6 h-6 text-red-500" />
                    }
                    <span className={compliance.passed ? "text-emerald-700" : "text-red-700"}>{compliance.message}</span>
                </div>
                <div className="bg-indigo-50 rounded-xl shadow p-6 mt-4 border border-indigo-100">
                    <div className="font-bold mb-2">Summary</div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <User className="w-5 h-5 text-indigo-600" />
                        <span>{driver.license || "Driver"}</span>
                        <span>⇄</span>
                        <Car className="w-5 h-5 text-indigo-600" />
                        <span>{vehicle.plate || "Vehicle"}</span>
                        <span>⇄</span>
                        <Home className="w-5 h-5 text-emerald-500" />
                        <span>{base.id || "Base"}</span>
                    </div>
                </div>
            </div>
        ),
    ];

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">

            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-900">Pairing Wizard</span>
                    <div className="flex items-center gap-2">
                        <Car className="w-6 h-6 text-slate-700" />
                    </div>
                </nav>

                {/* STEPPER */}
                <div className="bg-white px-8 py-6 border-b border-slate-200">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex gap-4 md:gap-8 overflow-x-auto">
                            {steps.map((step, idx) => (
                                <button
                                    key={step.label}
                                    className={`flex items-center gap-2 pb-3 font-semibold whitespace-nowrap border-b-2 transition-all ${activeStep === idx
                                        ? "border-slate-900 text-slate-900"
                                        : activeStep > idx
                                            ? "border-emerald-500 text-emerald-600"
                                            : "border-transparent text-slate-400 hover:text-slate-600"
                                        }`}
                                    onClick={() => setActiveStep(idx)}
                                >
                                    <span className={`rounded-full px-3 py-1 text-sm font-bold transition-all ${activeStep === idx
                                        ? "bg-slate-900 text-white"
                                        : activeStep > idx
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-slate-100 text-slate-400"
                                        }`}>
                                        {idx + 1}
                                    </span>
                                    {step.icon}
                                    <span className="hidden md:inline">{step.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* STEP CONTENT */}
                <main className="flex-1 p-6 md:p-12">
                    <div className="max-w-7xl mx-auto">
                        {/* Step 1: Select Driver */}
                        {activeStep === 0 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Driver</h2>
                                    <p className="text-slate-600">Choose a licensed driver for this pairing</p>
                                </div>

                                <div className="relative">
                                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                        placeholder="Search license no. or driver name"
                                        value={driverSearch}
                                        onChange={e => setDriverSearch(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {drivers.filter(d => d.licenseNo.toLowerCase().includes(driverSearch.toLowerCase()) || d.name.toLowerCase().includes(driverSearch.toLowerCase())).map(d => (
                                        <button
                                            key={d.licenseNo}
                                            onClick={() => { setDriver({ license: d.licenseNo, name: d.name, expiry: d.licenseExpiry, status: d.status }); setActiveStep(1); }}
                                            className={`bg-white rounded-xl border-2 p-4 text-left shadow-sm hover:shadow-md transition-all ${driver.license === d.licenseNo ? 'border-slate-900 ring-2 ring-slate-900 ring-opacity-20' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <User className="w-5 h-5 text-slate-600" />
                                                {driver.license === d.licenseNo && (
                                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                )}
                                            </div>
                                            <div className="font-semibold text-slate-900 mb-1">{d.name}</div>
                                            <div className="text-sm text-slate-600 mb-1">{d.licenseNo}</div>
                                            <div className="text-xs text-slate-500">Expiry: {d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : 'N/A'}</div>
                                        </button>
                                    ))}
                                </div>

                                {driver.license && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 rounded-lg">
                                            <User className="w-6 h-6 text-slate-700" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-900 mb-1">{driver.name}</div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span>Status: <span className={driver.status === "ACTIVE" ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>{driver.status}</span></span>
                                                <span className="text-slate-400">•</span>
                                                <span>Expiry: <span className="font-semibold text-slate-900">{driver.expiry || 'N/A'}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Select Vehicle */}
                        {activeStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Vehicle</h2>
                                    <p className="text-slate-600">Choose a registered vehicle for this pairing</p>
                                </div>

                                <div className="relative">
                                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                        placeholder="Search plate or VIN"
                                        value={vehicleSearch}
                                        onChange={e => setVehicleSearch(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {vehicles.filter(v => v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) || (v.vin || '').toLowerCase().includes(vehicleSearch.toLowerCase())).map(v => (
                                        <button
                                            key={v.plate}
                                            onClick={() => { setVehicle({ plate: v.plate, vin: v.vin, insurance: v.insuranceExpiry }); setActiveStep(2); }}
                                            className={`bg-white rounded-xl border-2 p-4 text-left shadow-sm hover:shadow-md transition-all ${vehicle.plate === v.plate ? 'border-slate-900 ring-2 ring-slate-900 ring-opacity-20' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <Car className="w-5 h-5 text-slate-600" />
                                                {vehicle.plate === v.plate && (
                                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                )}
                                            </div>
                                            <div className="font-semibold text-slate-900 mb-1">{v.plate}</div>
                                            <div className="text-sm text-slate-600 mb-1">{v.model || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">VIN: {v.vin || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">Insurance: {v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString() : 'N/A'}</div>
                                        </button>
                                    ))}
                                </div>

                                {vehicle.plate && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 rounded-lg">
                                            <Car className="w-6 h-6 text-slate-700" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-900 mb-1">{vehicle.plate}</div>
                                            <div className="text-sm text-slate-600">
                                                Insurance: <span className={vehicle.insurance ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>{vehicle.insurance || 'Not Available'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Select Base */}
                        {activeStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Base</h2>
                                    <p className="text-slate-600">Choose a base station for this pairing</p>
                                </div>

                                <div className="relative">
                                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                                    <input
                                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                        placeholder="Search base no or borough"
                                        value={baseSearch}
                                        onChange={e => setBaseSearch(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {bases.filter(b => b.baseNo.toLowerCase().includes(baseSearch.toLowerCase()) || (b.borough || '').toLowerCase().includes(baseSearch.toLowerCase())).map(b => (
                                        <button
                                            key={b.baseNo}
                                            onClick={() => { setBase({ id: b.baseNo, borough: b.borough, capValid: true }); setActiveStep(3); }}
                                            className={`bg-white rounded-xl border-2 p-4 text-left shadow-sm hover:shadow-md transition-all ${base.id === b.baseNo ? 'border-emerald-600 ring-2 ring-emerald-600 ring-opacity-20' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <Home className="w-5 h-5 text-slate-600" />
                                                {base.id === b.baseNo && (
                                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                )}
                                            </div>
                                            <div className="font-semibold text-slate-900 mb-1">{b.baseNo}</div>
                                            <div className="text-sm text-slate-600">{b.borough}</div>
                                        </button>
                                    ))}
                                </div>

                                {base.id && (
                                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-emerald-100 rounded-lg">
                                                <Home className="w-6 h-6 text-emerald-700" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900 mb-1">{base.id}</div>
                                                <div className="text-sm text-slate-600">Borough: <span className="font-semibold text-slate-900">{base.borough}</span></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            {base.capValid
                                                ? <><CheckCircle className="w-4 h-4 text-emerald-600" /><span className="text-emerald-600 font-semibold">Permit Cap Valid</span></>
                                                : <><XCircle className="w-4 h-4 text-red-600" /><span className="text-red-600 font-semibold">Permit Cap Exceeded</span></>
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 4: Set Duration */}
                        {activeStep === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Set Duration</h2>
                                    <p className="text-slate-600">Define the pairing period</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                            value={duration.start}
                                            onChange={e => setDuration({ ...duration, start: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">End Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                                            value={duration.end}
                                            onChange={e => setDuration({ ...duration, end: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className={`rounded-xl border-2 p-6 flex items-center gap-4 ${compliance.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                    {compliance.passed
                                        ? <CheckCircle className="w-6 h-6 text-emerald-600" />
                                        : <XCircle className="w-6 h-6 text-red-600" />
                                    }
                                    <span className={`font-semibold ${compliance.passed ? "text-emerald-700" : "text-red-700"}`}>{compliance.message}</span>
                                </div>

                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-8 mt-6">
                                    <h3 className="font-bold text-lg text-slate-900 mb-6">Pairing Summary</h3>
                                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                <User className="w-6 h-6 text-slate-700" />
                                            </div>
                                            <span className="font-semibold text-slate-900">{driver.license || "Driver"}</span>
                                            <span className="text-sm text-slate-600">{driver.name || "Not selected"}</span>
                                        </div>
                                        <div className="text-slate-400 text-2xl">⇄</div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                <Car className="w-6 h-6 text-slate-700" />
                                            </div>
                                            <span className="font-semibold text-slate-900">{vehicle.plate || "Vehicle"}</span>
                                            <span className="text-sm text-slate-600">{vehicle.plate ? "Selected" : "Not selected"}</span>
                                        </div>
                                        <div className="text-slate-400 text-2xl">⇄</div>
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                <Home className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <span className="font-semibold text-slate-900">{base.id || "Base"}</span>
                                            <span className="text-sm text-slate-600">{base.borough || "Not selected"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                            <button
                                className="px-6 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                disabled={activeStep === 0}
                                onClick={() => setActiveStep(activeStep - 1)}
                            >
                                Back
                            </button>
                            {activeStep < steps.length - 1 ? (
                                <button
                                    className="px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                    disabled={
                                        (activeStep === 0 && !driver.license) ||
                                        (activeStep === 1 && !vehicle.plate) ||
                                        (activeStep === 2 && !base.id)
                                    }
                                    onClick={() => setActiveStep(activeStep + 1)}
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                    disabled={!driver.license || !vehicle.plate || !base.id || !duration.start || !duration.end}
                                    onClick={() => alert("Pairing Created!")}
                                >
                                    Create Pairing
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
