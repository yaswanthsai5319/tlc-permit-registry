"use client";
import React, { useState, useEffect } from "react";
import { ShieldCheck, XCircle, Search } from "lucide-react";
import { storage } from '@/app/utils/storage';

export default function PublicVerification() {
    const [licenseId, setLicenseId] = useState("");
    const [captcha, setCaptcha] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [permits, setPermits] = useState([]);

    useEffect(() => {
        const stored = storage.get('permits') || [];
        setPermits(stored);
    }, []);

    const handleVerify = e => {
        e.preventDefault();
        setError("");
        if (!licenseId) {
            setError("Please enter a License ID.");
            setResult(null);
            return;
        }
        if (captcha !== "1234") {
            setError("Captcha incorrect.");
            setResult(null);
            return;
        }
        const id = licenseId.trim();
        // try to find a permit by licenseNo or vehiclePlate or id
        const found = permits.find(p => p.licenseNo === id || p.vehiclePlate === id || p.id === id);
        if (found) {
            const type = found.licenseNo === id ? 'Driver' : (found.vehiclePlate === id ? 'Vehicle' : 'Permit');
            setResult({
                type,
                status: found.status || 'N/A',
                updated: found.approvedAt || found.submittedAt || found.insuranceExpiry || 'Unknown',
                driverName: found.driverName,
                licenseNo: found.licenseNo,
                vehiclePlate: found.vehiclePlate,
                borough: found.borough,
                licenseExpiry: found.licenseExpiry,
                insuranceExpiry: found.insuranceExpiry
            });
        } else {
            setError("No record found. Please check the ID.");
            setResult(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col items-center">
            {/* HEADER */}
            <header className="w-full flex justify-between items-center bg-white border-b border-slate-200 shadow-sm px-8 py-4 mb-12">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-slate-700" />
                    <div className="text-xl font-bold text-slate-900">Public Verification</div>
                </div>
                {/*<img src="/logo.png" alt="Logo" className="h-10" />*/}
            </header>

            {/* SEARCH FORM */}
            <form
                className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 flex flex-col gap-6 w-full max-w-md"
                onSubmit={handleVerify}
            >
                <div>
                    <label className="font-semibold text-slate-900 text-lg mb-2 block">Verify by License ID</label>
                    <p className="text-sm text-slate-600 mb-4">Enter your License ID, Vehicle Plate, or Permit ID to verify status</p>
                </div>

                <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input
                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                        placeholder="Enter License ID, Plate, or Permit ID"
                        value={licenseId}
                        onChange={e => setLicenseId(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <input
                        className="flex-1 px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                        placeholder="Captcha: 1234"
                        value={captcha}
                        onChange={e => setCaptcha(e.target.value)}
                    />
                    <span className="text-sm text-slate-500 whitespace-nowrap">Enter 1234</span>
                </div>

                <button
                    type="submit"
                    className="w-full bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-md"
                >
                    Verify
                </button>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}
            </form>

            {/* RESULT CARD */}
            {/* RESULT MODAL */}
            {result && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                                </div>
                                <span className="font-bold text-xl text-slate-900">Verification Result</span>
                            </div>
                            <button
                                onClick={() => setResult(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-600">Permit Type:</span>
                                <span className="font-semibold text-slate-900">{result.type}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-600">Status:</span>
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${result.status.toLowerCase().includes("approved") || result.status === "ACTIVE"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${result.status.toLowerCase().includes("approved") || result.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"
                                        }`}></span>
                                    {result.status}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-600">Last Updated:</span>
                                <span className="text-sm text-slate-700">{result.updated}</span>
                            </div>

                            {result.driverName && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Driver:</span>
                                    <span className="font-semibold text-slate-900">{result.driverName}</span>
                                </div>
                            )}

                            {result.licenseNo && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">License:</span>
                                    <span className="font-semibold text-slate-900">{result.licenseNo}</span>
                                </div>
                            )}

                            {result.vehiclePlate && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Plate:</span>
                                    <span className="font-semibold text-slate-900">{result.vehiclePlate}</span>
                                </div>
                            )}

                            {result.borough && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Borough:</span>
                                    <span className="font-semibold text-slate-900">{result.borough}</span>
                                </div>
                            )}

                            {result.licenseExpiry && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">License Expiry:</span>
                                    <span className="font-semibold text-slate-900">{new Date(result.licenseExpiry).toLocaleDateString()}</span>
                                </div>
                            )}

                            {result.insuranceExpiry && (
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Insurance Expiry:</span>
                                    <span className="font-semibold text-slate-900">{new Date(result.insuranceExpiry).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-200">
                            <button
                                onClick={() => setResult(null)}
                                className="w-full bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HELP LINK */}
            <div className="mt-8 text-sm text-slate-600">
                Need help?{" "}
                <a
                    href="mailto:support@example.com"
                    className="text-slate-900 underline font-semibold hover:text-slate-700 transition-colors"
                >
                    Contact Support
                </a>
            </div>
        </div>
    );
}
