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
        <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
            {/* SIDEBAR */}
            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Car className="w-6 h-6 text-slate-700" />
                        <div>
                            <div className="text-2xl font-bold text-slate-900">Entity Details</div>
                            <div className="text-sm text-slate-600">Inspect vehicles, drivers, or bases</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={entityType}
                            onChange={e => { setEntityType(e.target.value); setSelected(null); setSearchTerm(''); }}
                            className="px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all cursor-pointer"
                        >
                            <option value="Vehicle">Vehicle</option>
                            <option value="Driver">Driver</option>
                            <option value="Base">Base</option>
                        </select>
                        <div className="relative w-80">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={`Search ${entityType}`}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                </nav>

                {/* TABS */}
                <div className="bg-white px-8 py-6 border-b border-slate-200">
                    <div className="max-w-7xl mx-auto flex gap-8">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                className={`pb-3 font-semibold border-b-2 transition-all ${activeTab === tab
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                                    }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TAB CONTENT */}
                <main className="flex-1 p-6 md:p-12">
                    <div className="max-w-7xl mx-auto">
                        {activeTab === "Overview" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 flex flex-col gap-2">
                                    <div className="font-bold text-lg mb-2 text-slate-900">Entities</div>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {listForType.length === 0 && <div className="text-slate-500 text-center py-8">No entities found</div>}
                                        {listForType.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelected(entityType === 'Vehicle' ? item.plate : entityType === 'Driver' ? item.license : item.baseNo)}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selected === (entityType === 'Vehicle' ? item.plate : entityType === 'Driver' ? item.license : item.baseNo) ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900 ring-opacity-20' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'} flex items-center justify-between`}
                                            >
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-900">{entityType === 'Vehicle' ? item.plate : entityType === 'Driver' ? item.name : item.baseNo}</div>
                                                    <div className="text-xs text-slate-600">{entityType === 'Vehicle' ? `${item.make || ''} ${item.model || ''}` : entityType === 'Driver' ? item.license : item.borough}</div>
                                                </div>
                                                {entityType === 'Vehicle' && item.status && (
                                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${item.status.toLowerCase().includes('approved') ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                                        {item.status}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <div className="text-3xl font-bold text-slate-900">{selectedDetails ? (entityType === 'Vehicle' ? selectedDetails.plate : entityType === 'Driver' ? selectedDetails.name : selectedDetails.baseNo) : 'Select an entity'}</div>
                                            <div className="text-sm text-slate-600 mt-1">{entityType} details</div>
                                        </div>
                                        <div>
                                            {selectedDetails && selectedDetails.status && (
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${selectedDetails.status.toLowerCase().includes('approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${selectedDetails.status.toLowerCase().includes('approved') ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                                    {selectedDetails.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {selectedDetails ? (
                                            <>
                                                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                                                    {entityType === 'Vehicle' ? (
                                                        <>
                                                            <div className="mb-4">
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">VIN</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.vin}</div>
                                                            </div>
                                                            <div className="mb-4">
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Insurance Expiry</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.insuranceExpiry ? new Date(selectedDetails.insuranceExpiry).toLocaleDateString() : '-'}</div>
                                                            </div>
                                                            <div className="mb-4">
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Base</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.base} ({selectedDetails.borough})</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Driver</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.driver}</div>
                                                            </div>
                                                        </>
                                                    ) : entityType === 'Driver' ? (
                                                        <>
                                                            <div className="mb-4">
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">License</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.license}</div>
                                                            </div>
                                                            <div className="mb-4">
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Expiry</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.licenseExpiry ? new Date(selectedDetails.licenseExpiry).toLocaleDateString() : '-'}</div>
                                                            </div>
                                                            <div className="mb-4">
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Vehicle</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.vehiclePlate}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Base</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.base} ({selectedDetails.borough})</div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="mb-4">
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Base</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.baseNo}</div>
                                                            </div>
                                                            <div className="mb-4">
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Borough</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.borough}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Vehicles</div>
                                                                <div className="text-sm text-slate-900 font-medium">{selectedDetails.vehicles.join(', ') || '-'}</div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="bg-white rounded-xl p-6 border border-slate-200">
                                                    <div className="text-sm font-semibold text-slate-900 mb-4">Permit Info</div>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <div className="text-xs text-slate-600 mb-1">Submitted</div>
                                                            <div className="text-sm text-slate-900 font-medium">{selectedDetails.submittedAt ? new Date(selectedDetails.submittedAt).toLocaleString() : '-'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-slate-600 mb-1">Approved</div>
                                                            <div className="text-sm text-slate-900 font-medium">{selectedDetails.approvedAt ? new Date(selectedDetails.approvedAt).toLocaleString() : '-'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="col-span-2 text-center py-12 text-slate-500">
                                                <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                <p>No entity selected. Please choose from the list on the left.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "Timeline" && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                                <div className="font-bold text-xl mb-6 text-slate-900">Timeline Events</div>
                                <ul className="space-y-3">
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
                                            return events.length === 0 ? (
                                                <li className="text-center py-8 text-slate-500">No events found.</li>
                                            ) : events.map((ev, idx) => (
                                                <li key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                    <Clock className="w-5 h-5 text-slate-600" />
                                                    <span className="font-semibold text-slate-900">{new Date(ev.time).toLocaleString()}</span>
                                                    <span className="text-slate-600">•</span>
                                                    <span className="text-slate-700">{ev.event}</span>
                                                </li>
                                            ));
                                        })()
                                    ) : (
                                        <li className="text-center py-8 text-slate-500">Select an entity to view timeline events</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {activeTab === "Pairings" && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                                <div className="font-bold text-xl mb-6 text-slate-900">Active Pairings</div>
                                <ul className="space-y-3">
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
                                            if (entries.length === 0) return <li className="text-center py-8 text-slate-500">No pairings for selected entity</li>;
                                            return entries.map((p, idx) => (
                                                <li key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                    <User className="w-5 h-5 text-slate-600" />
                                                    <span className="font-medium text-slate-900">{p.driver}</span>
                                                    <span className="text-slate-400">⇄</span>
                                                    <Car className="w-5 h-5 text-slate-600" />
                                                    <span className="font-medium text-slate-900">{p.vehicle}</span>
                                                    <span className="text-slate-400">⇄</span>
                                                    <Home className="w-5 h-5 text-emerald-600" />
                                                    <span className="font-medium text-slate-900">{p.base}</span>
                                                </li>
                                            ));
                                        })()
                                    ) : (
                                        <li className="text-center py-8 text-slate-500">Select an entity to view active pairings.</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {activeTab === "Audit" && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
                                <div className="font-bold text-xl mb-6 text-slate-900">Audit Logs</div>
                                <ul className="space-y-2">
                                    {auditLogs.length === 0 ? (
                                        <li className="text-center py-8 text-slate-500">No audit logs recorded</li>
                                    ) : (
                                        auditLogs.filter(l => !l.recordId || !selected || l.recordId === selected).map((log, idx) => (
                                            <li key={idx}>
                                                <button
                                                    className="w-full text-left flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                                                    onClick={() => { }}
                                                >
                                                    <List className="w-4 h-4 text-slate-500" />
                                                    <span className="font-semibold text-slate-900">{log.type}</span>
                                                    <span className="text-sm text-slate-600">{log.timestamp}</span>
                                                    <span className="text-sm text-slate-700">{log.action}</span>
                                                    <span className="text-slate-500 text-sm">{log.reason}</span>
                                                </button>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
