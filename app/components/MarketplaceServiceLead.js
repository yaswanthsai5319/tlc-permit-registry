"use client";
import React, { useState, useEffect, useMemo } from "react";
import { TrendingUp, AlertCircle, Search, LogOut, Clock, CheckCircle, XCircle, Bell, HelpCircle, Grid, Shield } from "lucide-react";
import { storage } from '../utils/storage';

export default function MarketplaceServiceLead({ user, onLogout }) {
    const [permits, setPermits] = useState([]);
    const [pairings, setPairings] = useState([]);
    const [vehicleApplications, setVehicleApplications] = useState([]);
    const [driverPermits, setDriverPermits] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        setPermits(storage.get('permits') || []);
        setPairings(storage.get('pairings') || []);
        setVehicleApplications(storage.get('vehicleApplications') || []);
        setDriverPermits(storage.get('driverPermits') || []);
    }, []);

    // Calculate expiring items (within 30 days)
    const expiringItems = useMemo(() => {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const expiring = [];

        permits.forEach(p => {
            const expiryDate = p.permitEndDate || p.licenseExpiry || p.insuranceExpiry;
            if (expiryDate) {
                const expiry = new Date(expiryDate);
                if (expiry > now && expiry <= thirtyDaysFromNow) {
                    expiring.push({
                        type: 'Permit',
                        id: p.id,
                        name: p.driverName || p.vehiclePlate,
                        expiryDate: expiryDate,
                        daysLeft: Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
                    });
                }
            }
        });

        vehicleApplications.forEach(v => {
            // Check for expiring insurance or inspection
            if (v.insuranceExpiry) {
                const expiry = new Date(v.insuranceExpiry);
                if (expiry > now && expiry <= thirtyDaysFromNow) {
                    expiring.push({
                        type: 'Vehicle Insurance',
                        id: v.id,
                        name: v.licensePlate,
                        expiryDate: v.insuranceExpiry,
                        daysLeft: Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
                    });
                }
            }
        });

        return expiring.sort((a, b) => a.daysLeft - b.daysLeft);
    }, [permits, vehicleApplications]);

    // Check pairing eligibility
    const checkPairingEligibility = (driverLicense, vehiclePlate) => {
        const driver = permits.find(p => p.licenseNo === driverLicense);
        const vehicle = permits.find(p => p.vehiclePlate === vehiclePlate);

        const issues = [];

        if (!driver) {
            issues.push('Driver permit not found');
        } else {
            if (driver.status?.toLowerCase() !== 'approved') {
                issues.push('Driver permit not approved');
            }
            if (driver.driverSuspended) {
                issues.push('Driver is suspended');
            }
            const licenseExpiry = new Date(driver.licenseExpiry);
            if (licenseExpiry < new Date()) {
                issues.push('Driver license expired');
            }
        }

        if (!vehicle) {
            issues.push('Vehicle permit not found');
        } else {
            if (vehicle.status?.toLowerCase() !== 'approved') {
                issues.push('Vehicle permit not approved');
            }
            const insuranceExpiry = new Date(vehicle.insuranceExpiry);
            if (insuranceExpiry < new Date()) {
                issues.push('Vehicle insurance expired');
            }
        }

        return {
            eligible: issues.length === 0,
            issues
        };
    };

    const eligiblePairings = useMemo(() => {
        return pairings.filter(p => {
            const check = checkPairingEligibility(p.driverLicense, p.vehiclePlate);
            return check.eligible;
        });
    }, [pairings, permits]);

    const ineligiblePairings = useMemo(() => {
        return pairings.filter(p => {
            const check = checkPairingEligibility(p.driverLicense, p.vehiclePlate);
            return !check.eligible;
        }).map(p => ({
            ...p,
            eligibilityCheck: checkPairingEligibility(p.driverLicense, p.vehiclePlate)
        }));
    }, [pairings, permits]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
            {/* NAVBAR */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-purple-700">
                        <TrendingUp className="w-8 h-8 fill-current" />
                        <span className="text-xl font-bold tracking-tight">Marketplace</span>
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
                            placeholder="Search Marketplace..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all w-64"
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
                            <div className="text-sm text-slate-600 font-semibold mb-2">Total Pairings</div>
                            <div className="text-3xl font-bold text-slate-900">{pairings.length}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-6 bg-gradient-to-br from-emerald-50 to-white">
                            <div className="text-sm text-emerald-600 font-semibold mb-2">Eligible Pairings</div>
                            <div className="text-3xl font-bold text-emerald-700">{eligiblePairings.length}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 bg-gradient-to-br from-red-50 to-white">
                            <div className="text-sm text-red-600 font-semibold mb-2">Ineligible Pairings</div>
                            <div className="text-3xl font-bold text-red-700">{ineligiblePairings.length}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-6 bg-gradient-to-br from-amber-50 to-white">
                            <div className="text-sm text-amber-600 font-semibold mb-2">Expiring Soon</div>
                            <div className="text-3xl font-bold text-amber-700">{expiringItems.length}</div>
                        </div>
                    </div>

                    {/* Expiring Items */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-amber-600" />
                                <h2 className="text-lg font-bold text-slate-900">Expiring Within 30 Days</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            {expiringItems.length > 0 ? (
                                <div className="space-y-3">
                                    {expiringItems.map((item, idx) => (
                                        <div key={idx} className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <div className="text-xs text-amber-600 font-semibold mb-1">Type</div>
                                                        <div className="text-sm text-slate-900">{item.type}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-amber-600 font-semibold mb-1">Name/ID</div>
                                                        <div className="text-sm text-slate-900">{item.name}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-amber-600 font-semibold mb-1">Expiry Date</div>
                                                        <div className="text-sm text-slate-900">{new Date(item.expiryDate).toLocaleDateString()}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-amber-600 font-semibold mb-1">Days Left</div>
                                                        <div className={`text-sm font-bold ${item.daysLeft <= 7 ? 'text-red-600' : 'text-amber-700'}`}>
                                                            {item.daysLeft} days
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500">No items expiring in the next 30 days</div>
                            )}
                        </div>
                    </div>

                    {/* Pairing Eligibility */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <h2 className="text-lg font-bold text-slate-900">Ineligible Pairings</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            {ineligiblePairings.length > 0 ? (
                                <div className="space-y-3">
                                    {ineligiblePairings.map((pairing) => (
                                        <div key={pairing.id} className="bg-red-50 rounded-lg p-4 border border-red-200">
                                            <div className="flex items-start gap-3">
                                                <XCircle className="w-5 h-5 text-red-600 mt-1" />
                                                <div className="flex-1">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                                        <div>
                                                            <div className="text-xs text-red-600 font-semibold mb-1">Driver</div>
                                                            <div className="text-sm text-slate-900">{pairing.driverName || pairing.driverLicense}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-red-600 font-semibold mb-1">Vehicle</div>
                                                            <div className="text-sm text-slate-900">{pairing.vehiclePlate}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-red-600 font-semibold mb-1">Base</div>
                                                            <div className="text-sm text-slate-900">{pairing.baseNo}</div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white rounded p-3 border border-red-200">
                                                        <div className="text-xs text-red-600 font-semibold mb-2">Issues:</div>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {pairing.eligibilityCheck.issues.map((issue, idx) => (
                                                                <li key={idx} className="text-sm text-slate-700">{issue}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                                    <div className="text-lg font-semibold text-slate-600 mb-2">All Pairings Eligible</div>
                                    <div className="text-sm text-slate-500">No eligibility issues found</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Eligible Pairings Summary */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <h2 className="text-lg font-bold text-slate-900">Eligible Pairings ({eligiblePairings.length})</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            {eligiblePairings.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {eligiblePairings.slice(0, 6).map((pairing) => (
                                        <div key={pairing.id} className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                <span className="text-xs font-semibold text-emerald-700">ELIGIBLE</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="text-xs text-emerald-600 font-semibold">Driver</div>
                                                    <div className="text-sm text-slate-900">{pairing.driverName || pairing.driverLicense}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-emerald-600 font-semibold">Vehicle</div>
                                                    <div className="text-sm text-slate-900">{pairing.vehiclePlate}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500">No eligible pairings found</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
