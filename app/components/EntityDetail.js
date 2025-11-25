"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Car, User, Home, Clock, List, Search } from "lucide-react";
import { storage } from '@/app/utils/storage';

const tabs = ["Overview", "Timeline", "Pairings", "Audit"];

export default function EntityDetail() {
    const [activeTab, setActiveTab] = useState("Overview");
    const [entityType, setEntityType] = useState('Vehicle');
    const [searchTerm, setSearchTerm] = useState('');
    const [permits, setPermits] = useState([]);
    const [selected, setSelected] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);

    useEffect(() => {
        const stored = storage.get('permits') || [];
        setPermits(stored);
        const logs = storage.get('auditLogs') || [];
        setAuditLogs(logs);
    }, []);

    // derive lists
    const vehicleList = useMemo(() => {
        const map = new Map();
        permits.forEach(p => {
            if (p.vehiclePlate && !map.has(p.vehiclePlate)) {
                map.set(p.vehiclePlate, { plate: p.vehiclePlate, vin: p.vehicleVin, make: p.vehicleMake, model: p.vehicleModel, year: p.vehicleYear, insuranceExpiry: p.insuranceExpiry, status: p.status, base: p.baseNo, borough: p.borough });
            }
        });
        return Array.from(map.values());
    }, [permits]);

    const driverList = useMemo(() => {
        const map = new Map();
        permits.forEach(p => {
            if (p.licenseNo && !map.has(p.licenseNo)) {
                map.set(p.licenseNo, { license: p.licenseNo, name: p.driverName, status: p.status, licenseExpiry: p.licenseExpiry, vehiclePlate: p.vehiclePlate });
            }
        });
        return Array.from(map.values());
    }, [permits]);

    const baseList = useMemo(() => {
        const map = new Map();
        permits.forEach(p => {
            if (p.baseNo && !map.has(p.baseNo)) {
                map.set(p.baseNo, { baseNo: p.baseNo, borough: p.borough });
            }
        });
        return Array.from(map.values());
    }, [permits]);

    const listForType = useMemo(() => {
        const q = searchTerm.toLowerCase();
        if (entityType === 'Vehicle') return vehicleList.filter(v => v.plate.toLowerCase().includes(q) || (v.make + ' ' + v.model).toLowerCase().includes(q));
        if (entityType === 'Driver') return driverList.filter(d => d.license.toLowerCase().includes(q) || d.name.toLowerCase().includes(q));
        return baseList.filter(b => b.baseNo.toLowerCase().includes(q) || (b.borough || '').toLowerCase().includes(q));
    }, [entityType, searchTerm, vehicleList, driverList, baseList]);

    // compute selected details
    const selectedDetails = useMemo(() => {
        if (!selected) return null;
        if (entityType === 'Vehicle') {
            const related = permits.filter(p => p.vehiclePlate === selected);
            const p = related[0];
            return {
                plate: p?.vehiclePlate || selected,
                vin: p?.vehicleVin || '-',
                make: p?.vehicleMake || '-',
                model: p?.vehicleModel || '-',
                year: p?.vehicleYear || '-',
                insuranceExpiry: p?.insuranceExpiry || '-',
                base: p?.baseNo || '-',
                borough: p?.borough || '-',
                status: p?.status || '-',
                driver: p?.driverName || '-',
                submittedAt: p?.submittedAt || null,
                approvedAt: p?.approvedAt || null,
            }
        }
        if (entityType === 'Driver') {
            const related = permits.filter(p => p.licenseNo === selected);
            const p = related[0];
            return {
                license: p?.licenseNo || selected,
                name: p?.driverName || '-',
                licenseExpiry: p?.licenseExpiry || '-',
                status: p?.status || '-',
                vehiclePlate: p?.vehiclePlate || '-',
                base: p?.baseNo || '-',
                borough: p?.borough || '-',
                submittedAt: p?.submittedAt || null,
            }
        }
        // base
        const related = permits.filter(p => p.baseNo === selected);
        return {
            baseNo: selected,
            borough: related[0]?.borough || '-',
            vehicles: Array.from(new Set(related.map(r => r.vehiclePlate)))
        }
    }, [selected, entityType, permits]);

    useEffect(() => {
        if (!selected && listForType && listForType.length > 0) {
            const first = listForType[0];
            setSelected(entityType === 'Vehicle' ? first.plate : entityType === 'Driver' ? first.license : first.baseNo);
        }
    }, [entityType, listForType]);

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* SIDEBAR */}
            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-end">
                    <button className="relative">
                        <Clock className="w-6 h-6 text-blue-700" />
                    </button>
                </nav>
                {/* ENTITY HEADER */}
                <header className="bg-white shadow flex items-center gap-4 px-8 py-6 justify-between">
                    <div className="flex items-center gap-4">
                        <Car className="w-8 h-8 text-indigo-600" />
                        <div>
                            <div className="text-xl font-bold">Entity Details</div>
                            <div className="text-sm text-gray-600">Inspect vehicles, drivers, or bases</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select value={entityType} onChange={e => { setEntityType(e.target.value); setSelected(null); setSearchTerm(''); }} className="px-3 py-2 border rounded-lg bg-white">
                            <option value="Vehicle">Vehicle</option>
                            <option value="Driver">Driver</option>
                            <option value="Base">Base</option>
                        </select>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 w-80">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`Search ${entityType}`} className="bg-transparent focus:outline-none w-full" />
                        </div>
                    </div>
                </header>
                {/* TABS */}
                <div className="bg-white px-8 pt-4 flex gap-8 border-b">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            className={`pb-2 font-semibold text-gray-700 border-b-2 transition ${activeTab === tab
                                ? "border-blue-600 text-blue-700"
                                : "border-transparent hover:text-blue-500"
                                }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                {/* TAB CONTENT */}
                <main className="flex-1 p-8">
                    {activeTab === "Overview" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2">
                                <div className="font-bold text-lg mb-2">Entities</div>
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {listForType.length === 0 && <div className="text-gray-500">No entities found</div>}
                                    {listForType.map((item, idx) => (
                                        <button key={idx} onClick={() => setSelected(entityType === 'Vehicle' ? item.plate : entityType === 'Driver' ? item.license : item.baseNo)} className={`w-full text-left p-3 bg-white rounded-md border ${selected === (entityType === 'Vehicle' ? item.plate : entityType === 'Driver' ? item.license : item.baseNo) ? 'ring-2 ring-blue-400' : 'hover:shadow-md'} flex items-center justify-between`}>
                                            <div>
                                                <div className="font-semibold text-sm">{entityType === 'Vehicle' ? item.plate : entityType === 'Driver' ? item.name : item.baseNo}</div>
                                                <div className="text-xs text-gray-500">{entityType === 'Vehicle' ? `${item.make || ''} ${item.model || ''}` : entityType === 'Driver' ? item.license : item.borough}</div>
                                            </div>
                                            <div className="text-xs text-gray-500">{entityType === 'Vehicle' ? (item.status || '') : ''}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-2 bg-white rounded-xl shadow p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-2xl font-bold">{selectedDetails ? (entityType === 'Vehicle' ? selectedDetails.plate : entityType === 'Driver' ? selectedDetails.name : selectedDetails.baseNo) : 'Select an entity'}</div>
                                        <div className="text-sm text-gray-600 mt-1">{entityType} details</div>
                                    </div>
                                    <div>
                                        {selectedDetails && (
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${selectedDetails.status && selectedDetails.status.toLowerCase().includes('approved') ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                {selectedDetails.status || 'N/A'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedDetails ? (
                                        <>
                                            <div className="bg-gradient-to-br from-white to-blue-50 rounded p-4 shadow-sm">
                                                {entityType === 'Vehicle' ? (
                                                    <>
                                                        <div className="font-semibold">VIN</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.vin}</div>
                                                        <div className="font-semibold">Insurance Expiry</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.insuranceExpiry ? new Date(selectedDetails.insuranceExpiry).toLocaleDateString() : '-'}</div>
                                                        <div className="font-semibold">Base</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.base} ({selectedDetails.borough})</div>
                                                        <div className="font-semibold">Driver</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.driver}</div>
                                                    </>
                                                ) : entityType === 'Driver' ? (
                                                    <>
                                                        <div className="font-semibold">License</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.license}</div>
                                                        <div className="font-semibold">Expiry</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.licenseExpiry ? new Date(selectedDetails.licenseExpiry).toLocaleDateString() : '-'}</div>
                                                        <div className="font-semibold">Vehicle</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.vehiclePlate}</div>
                                                        <div className="font-semibold">Base</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.base} ({selectedDetails.borough})</div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="font-semibold">Base</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.baseNo}</div>
                                                        <div className="font-semibold">Borough</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.borough}</div>
                                                        <div className="font-semibold">Vehicles</div>
                                                        <div className="text-sm text-gray-700 mb-2">{selectedDetails.vehicles.join(', ') || '-'}</div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="bg-white rounded p-4 shadow-sm">
                                                <div className="font-semibold">Permit Info</div>
                                                <div className="text-sm text-gray-700 mt-2">Submitted: {selectedDetails.submittedAt ? new Date(selectedDetails.submittedAt).toLocaleString() : '-'}</div>
                                                <div className="text-sm text-gray-700 mt-1">Approved: {selectedDetails.approvedAt ? new Date(selectedDetails.approvedAt).toLocaleString() : '-'}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-gray-500">No entity selected. Please choose from the list on the left.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "Timeline" && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-bold text-lg mb-4">Timeline Events</div>
                            <ul>
                                {selectedDetails ? (
                                    (() => {
                                        const related = entityType === 'Vehicle' ? permits.filter(p => p.vehiclePlate === selected) : entityType === 'Driver' ? permits.filter(p => p.licenseNo === selected) : permits.filter(p => p.baseNo === selected);
                                        const events = [];
                                        related.forEach(p => {
                                            if (p.submittedAt) events.push({ time: p.submittedAt, event: 'Submitted' });
                                            if (p.approvedAt) events.push({ time: p.approvedAt, event: 'Approved' });
                                            if (p.insuranceExpiry) events.push({ time: p.insuranceExpiry, event: 'Insurance Expiry' });
                                            if (p.licenseExpiry) events.push({ time: p.licenseExpiry, event: 'License Expiry' });
                                        });
                                        events.sort((a, b) => new Date(b.time) - new Date(a.time));
                                        return events.length === 0 ? (<li className="text-gray-500">No events found.</li>) : events.map((ev, idx) => (
                                            <li key={idx} className="mb-2 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                                <span className="font-semibold">{new Date(ev.time).toLocaleString()}</span>
                                                <span>{ev.event}</span>
                                            </li>
                                        ));
                                    })()
                                ) : (
                                    <li className="text-gray-500">Select an entity to view timeline events</li>
                                )}
                            </ul>
                        </div>
                    )}
                    {activeTab === "Pairings" && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-bold text-lg mb-4">Active Pairings</div>
                            <ul>
                                {selected ? (
                                    (() => {
                                        let entries = [];
                                        if (entityType === 'Vehicle') {
                                            entries = permits.filter(p => p.vehiclePlate === selected).map(p => ({ driver: p.driverName, vehicle: p.vehiclePlate, base: p.baseNo }));
                                        } else if (entityType === 'Driver') {
                                            entries = permits.filter(p => p.licenseNo === selected).map(p => ({ driver: p.driverName, vehicle: p.vehiclePlate, base: p.baseNo }));
                                        } else {
                                            entries = permits.filter(p => p.baseNo === selected).map(p => ({ driver: p.driverName, vehicle: p.vehiclePlate, base: p.baseNo }));
                                        }
                                        entries = entries.filter(Boolean);
                                        if (entries.length === 0) return <li className="text-gray-500">No pairings for selected entity</li>;
                                        return entries.map((p, idx) => (
                                            <li key={idx} className="flex items-center gap-4 mb-2">
                                                <User className="w-4 h-4 text-blue-500" />
                                                <span>{p.driver}</span>
                                                <span>⇄</span>
                                                <Car className="w-4 h-4 text-indigo-500" />
                                                <span>{p.vehicle}</span>
                                                <span>⇄</span>
                                                <Home className="w-4 h-4 text-green-500" />
                                                <span>{p.base}</span>
                                            </li>
                                        ));
                                    })()
                                ) : (
                                    <li className="text-gray-500">Select an entity to view active pairings.</li>
                                )}
                            </ul>
                        </div>
                    )}
                    {activeTab === "Audit" && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-bold text-lg mb-4">Audit Logs</div>
                            <ul>
                                {auditLogs.length === 0 ? (
                                    <li className="text-gray-500">No audit logs recorded</li>
                                ) : (
                                    auditLogs.filter(l => !l.recordId || !selected || l.recordId === selected).map((log, idx) => (
                                        <li key={idx} className="mb-2">
                                            <button
                                                className="w-full text-left flex items-center gap-2 p-2 rounded hover:bg-blue-50"
                                                onClick={() => { }}
                                            >
                                                <List className="w-4 h-4 text-gray-500" />
                                                <span className="font-semibold">{log.type}</span>
                                                <span className="text-sm text-gray-600">{log.timestamp}</span>
                                                <span className="text-sm">{log.action}</span>
                                                <span className="text-gray-500">{log.reason}</span>
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
