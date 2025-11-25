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
        <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 to-emerald-50">

            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-end">
                    <span className="font-bold text-indigo-900">Pairing Wizard</span>
                </nav>
                {/* HEADER */}
                <header className="bg-white shadow flex items-center gap-4 px-8 py-6">
                    <Car className="w-8 h-8 text-indigo-600" />
                    <div className="text-xl font-bold">Pairing Wizard</div>
                </header>
                {/* STEPPER */}
                <div className="bg-white px-8 pt-4 flex gap-8 border-b">
                    {steps.map((step, idx) => (
                        <button
                            key={step.label}
                            className={`flex items-center gap-2 pb-2 font-semibold text-gray-700 border-b-2 transition ${activeStep === idx
                                ? "border-indigo-600 text-indigo-700"
                                : "border-transparent hover:text-indigo-500"
                                }`}
                            onClick={() => setActiveStep(idx)}
                        >
                            <span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-1 mr-2">{idx + 1}</span>
                            {step.icon}
                            {step.label}
                        </button>
                    ))}
                </div>
                {/* STEP CONTENT */}
                <main className="flex-1 p-8">
                    {stepContent[activeStep]}
                    <div className="flex justify-between mt-8">
                        <button
                            className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                            disabled={activeStep === 0}
                            onClick={() => setActiveStep(activeStep - 1)}
                        >
                            Back
                        </button>
                        {activeStep < steps.length - 1 ? (
                            <button
                                className="px-4 py-2 rounded bg-indigo-700 text-white font-semibold"
                                onClick={() => setActiveStep(activeStep + 1)}
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                    className="px-6 py-2 rounded bg-emerald-600 text-white font-bold"
                                onClick={() => alert("Pairing Created!")}
                            >
                                Create Pairing
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
