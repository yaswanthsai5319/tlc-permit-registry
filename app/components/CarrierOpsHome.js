"use client";
import React, { useState, useEffect } from "react";
import { Users, Car, LogOut, Plus, X, Calendar, Search, Bell, HelpCircle, Grid, Shield } from "lucide-react";
import { storage } from '../utils/storage';
import PairingWizard from './PairingWizard';

export default function CarrierOpsHome({ user, onLogout }) {
    const [permits, setPermits] = useState([]);
    const [pairings, setPairings] = useState([]);
    const [showPairingWizard, setShowPairingWizard] = useState(false);
    const [activeTab, setActiveTab] = useState('pairings');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setPermits(storage.get('permits') || []);
        setPairings(storage.get('pairings') || []);
    };

    const handlePairingCreated = () => {
        setShowPairingWizard(false);
        loadData();
    };

    const closePairing = (pairingId) => {
        const allPairings = storage.get('pairings') || [];
        const updatedPairings = allPairings.map(p =>
            p.id === pairingId ? { ...p, end: new Date().toISOString(), closedBy: user.username } : p
        );
        storage.set('pairings', updatedPairings);
        loadData();
    };

    const activePairings = pairings.filter(p => new Date(p.end) > new Date());
    const closedPairings = pairings.filter(p => new Date(p.end) <= new Date());
    const approvedPermits = permits.filter(p => p.status?.toLowerCase() === 'approved');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
            {/* NAVBAR */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-blue-700">
                        <Users className="w-8 h-8 fill-current" />
                        <span className="text-xl font-bold tracking-tight">Carrier Ops</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <button className="text-slate-500 hover:text-slate-700 transition-colors">
                        <Grid className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Pairings..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64"
                        />
                    </div>
                    <button className="relative hover:bg-slate-100 p-2 rounded-lg transition-colors text-slate-600">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </button>
                    <button className="hover:bg-slate-100 p-2 rounded-lg transition-colors text-slate-600">
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-semibold text-slate-900">{user.username}</div>
                            <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-md transition-all font-semibold"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="p-6 md:p-12">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="text-sm text-slate-600 font-semibold mb-2">Active Pairings</div>
                            <div className="text-3xl font-bold text-emerald-600">{activePairings.length}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="text-sm text-slate-600 font-semibold mb-2">Closed Pairings</div>
                            <div className="text-3xl font-bold text-slate-900">{closedPairings.length}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="text-sm text-slate-600 font-semibold mb-2">Fleet Permits</div>
                            <div className="text-3xl font-bold text-blue-600">{approvedPermits.length}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="text-sm text-slate-600 font-semibold mb-2">Total Pairings</div>
                            <div className="text-3xl font-bold text-purple-600">{pairings.length}</div>
                        </div>
                    </div>

                    {/* Create Pairing Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowPairingWizard(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Pairing
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setActiveTab('pairings')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'pairings'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Active Pairings
                                </button>
                                <button
                                    onClick={() => setActiveTab('fleet')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'fleet'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <Car className="w-4 h-4" />
                                    Fleet Permits
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {activeTab === 'pairings' && (
                                <div className="space-y-4">
                                    <div className="text-sm text-slate-600 mb-4">
                                        {activePairings.length} active pairing{activePairings.length !== 1 ? 's' : ''}
                                    </div>
                                    {activePairings.length > 0 ? activePairings.map(pairing => (
                                        <div key={pairing.id} className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <div className="text-xs text-emerald-600 font-semibold mb-1">Driver</div>
                                                        <div className="text-sm text-slate-900">{pairing.driverName || pairing.driverLicense}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-emerald-600 font-semibold mb-1">Vehicle</div>
                                                        <div className="text-sm text-slate-900">{pairing.vehiclePlate}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-emerald-600 font-semibold mb-1">Base</div>
                                                        <div className="text-sm text-slate-900">{pairing.baseNo}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-emerald-600 font-semibold mb-1">End Date</div>
                                                        <div className="text-sm text-slate-900">{new Date(pairing.end).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => closePairing(pairing.id)}
                                                    className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all"
                                                >
                                                    Close Pairing
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 text-slate-500">
                                            No active pairings. Click "Create New Pairing" to get started.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'fleet' && (
                                <div className="space-y-4">
                                    <div className="text-sm text-slate-600 mb-4">
                                        {approvedPermits.length} approved permit{approvedPermits.length !== 1 ? 's' : ''}
                                    </div>
                                    {approvedPermits.length > 0 ? approvedPermits.map(permit => (
                                        <div key={permit.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                                <div>
                                                    <div className="text-xs text-blue-600 font-semibold mb-1">Driver</div>
                                                    <div className="text-sm text-slate-900">{permit.driverName || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-blue-600 font-semibold mb-1">License</div>
                                                    <div className="text-sm text-slate-900">{permit.licenseNo || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-blue-600 font-semibold mb-1">Vehicle</div>
                                                    <div className="text-sm text-slate-900">{permit.vehiclePlate || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-blue-600 font-semibold mb-1">Insurance</div>
                                                    <div className="text-sm text-slate-900">{permit.insuranceCarrier || 'N/A'}</div>
                                                    {permit.insuranceExpiry && (
                                                        <div className="text-xs text-slate-600">Exp: {new Date(permit.insuranceExpiry).toLocaleDateString()}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-blue-600 font-semibold mb-1">Base</div>
                                                    <div className="text-sm text-slate-900">{permit.baseNo || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 text-slate-500">No approved fleet permits found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Pairing Wizard Modal */}
            {showPairingWizard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600">
                            <h3 className="text-2xl font-bold text-white">Create New Pairing</h3>
                            <button
                                onClick={() => setShowPairingWizard(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-all"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <PairingWizard user={user} onComplete={handlePairingCreated} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
