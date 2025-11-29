"use client";
import React, { useState, useEffect, useMemo } from "react";
import { storage } from '@/app/utils/storage';
import { Bell, Search, Grid, AlertCircle, Clock, FileText, Settings, BarChart2, Globe, ClipboardCheck, HelpCircle, Car, User, Building, Shield } from "lucide-react";

import SearchPermit from "./SearchPermit";
import EntityDetail from "./EntityDetail";
import PairingWizard from "./PairingWizard";
import AdminConfiguration from "@/app/components/AdminConfiguration";
import AnalyticsBIHub from "@/app/components/AnalyticsBIHub";
import NotificationsCenter from "@/app/components/NotificationsCenter";

import { Tab } from "@headlessui/react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";

export default function TLCAdminDashboard({ user, onLogout }) {
    const [activeSidebar, setActiveSidebar] = useState("Dashboard");
    const [permits, setPermits] = useState([]);
    const [vehicleApplications, setVehicleApplications] = useState([]);
    const [driverApplications, setDriverApplications] = useState([]);
    const [searchVehicle, setSearchVehicle] = useState("");
    const [searchDriver, setSearchDriver] = useState("");
    const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
    const [selectedVehicleApplication, setSelectedVehicleApplication] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
    const [selectedDriverApplication, setSelectedDriverApplication] = useState(null);
    const [currentDriverStep, setCurrentDriverStep] = useState(0);

    // Calculate counts for badges
    const pendingVehicleCount = vehicleApplications.filter(a => !a.status || a.status === 'Pending').length;
    const pendingDriverCount = driverApplications.filter(a => !a.status || a.status === 'Pending').length;
    const totalPending = pendingVehicleCount + pendingDriverCount;

    const sidebarOptions = [
        { label: "Dashboard", icon: <Grid className="w-5 h-5 mr-2" /> },
        { label: "Search Permits", icon: <Search className="w-5 h-5 mr-2" /> },
        {
            label: "Approve Permits",
            icon: <ClipboardCheck className="w-5 h-5 mr-2" />,
            badge: totalPending > 0 ? totalPending : null
        },
        { label: "Pairing Wizard", icon: <Clock className="w-5 h-5 mr-2" /> },
        { label: "Entity Details", icon: <FileText className="w-5 h-5 mr-2" /> },
        { label: "Admin Configuration", icon: <Settings className="w-5 h-5 mr-2" /> },
        { label: "Analytics & BI Hub", icon: <BarChart2 className="w-5 h-5 mr-2" /> },

    ];

    const steps = [
        {
            title: "Verify Insurance Binder",
            description: "Ensure the insurance binder is valid and covers the entire operational window.",
            content: (application) => {
                if (!application) return <p className="text-sm text-red-500">No application data available.</p>;
                return (
                    <div>
                        <p className="text-sm text-gray-700 mb-4">
                            <strong>Insurance Details:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-sm text-gray-600">
                            <li>Insurance Provider: {application.insuranceProvider || "N/A"}</li>
                            <li>Policy Number: {application.policyNumber || "N/A"}</li>
                            <li>Valid From: {application.insuranceStartDate || "N/A"}</li>
                            <li>Valid To: {application.insuranceEndDate || "N/A"}</li>
                        </ul>
                    </div>
                );
            },
        },
        {
            title: "Verify Vehicle Inspection Certificate",
            description: "Ensure the vehicle inspection certificate is attached and valid.",
            content: (application) => {
                if (!application) return <p className="text-sm text-red-500">No application data available.</p>;
                return (
                    <div>
                        <p className="text-sm text-gray-700 mb-4">
                            <strong>Inspection Details:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-sm text-gray-600">
                            <li>Inspection Date: {application.inspectionDate || "N/A"}</li>
                            <li>Inspection Status: {application.inspectionStatus || "N/A"}</li>
                            <li>Certificate Attached: {application.inspectionCertificate ? "Yes" : "No"}</li>
                        </ul>
                    </div>
                );
            },
        },
        {
            title: "Verify Jurisdiction Compliance",
            description: "Ensure jurisdiction rules comply (e.g., borough cap limits are not exceeded).",
            content: (application) => {
                if (!application) return <p className="text-sm text-red-500">No application data available.</p>;
                return (
                    <div>
                        <p className="text-sm text-gray-700 mb-4">
                            <strong>Jurisdiction Details:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-sm text-gray-600">
                            <li>Borough: {application.borough || "N/A"}</li>
                            <li>Base Affiliation: {application.baseAffiliation || "N/A"}</li>
                            <li>Cap Limit Status: {application.capLimitStatus || "N/A"}</li>
                        </ul>
                    </div>
                );
            },
        },
        {
            title: "Verify VIN and License Plate",
            description: "Ensure the VIN and license plate are unique within TLC's records.",
            content: (application) => {
                if (!application) return <p className="text-sm text-red-500">No application data available.</p>;
                return (
                    <div>
                        <p className="text-sm text-gray-700 mb-4">
                            <strong>Vehicle Identification Details:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-sm text-gray-600">
                            <li>VIN: {application.vin || "N/A"}</li>
                            <li>License Plate: {application.licensePlate || "N/A"}</li>
                            <li>Uniqueness Check: {application.uniqueIdentifiers ? "Passed" : "Failed"}</li>
                        </ul>
                    </div>
                );
            },
        },
    ];

    const driverSteps = [
        {
            title: "Verify Training Certificate",
            description: "Ensure the driver's training certificate is attached.",
            content: (application) => {
                if (!application) return <p className="text-sm text-red-500">No application data available.</p>;
                return (
                    <div>
                        <p className="text-sm text-gray-700 mb-4">
                            <strong>Training Certificate Details:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-sm text-gray-600">
                            <li>Certificate Attached: {application.trainingCertificate ? "Yes" : "No"}</li>
                            <li>Certificate Date: {application.trainingCertificateDate || "N/A"}</li>
                        </ul>
                    </div>
                );
            },
        },
        {
            title: "Verify Driver License",
            description: "Ensure the driver's license (government-issued ID) is valid.",
            content: (application) => {
                if (!application) return <p className="text-sm text-red-500">No application data available.</p>;
                return (
                    <div>
                        <p className="text-sm text-gray-700 mb-4">
                            <strong>Driver License Details:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-sm text-gray-600">
                            <li>License Number: {application.licenseNumber || "N/A"}</li>
                            <li>Valid From: {application.licenseStartDate || "N/A"}</li>
                            <li>Valid To: {application.licenseEndDate || "N/A"}</li>
                        </ul>
                    </div>
                );
            },
        },
        {
            title: "Verify Violations Declaration",
            description: "Ensure the violations declaration matches TLC database (no outstanding violations).",
            content: (application) => {
                if (!application) return <p className="text-sm text-red-500">No application data available.</p>;
                return (
                    <div>
                        <p className="text-sm text-gray-700 mb-4">
                            <strong>Violations Declaration:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-sm text-gray-600">
                            <li>Outstanding Violations: {application.outstandingViolations ? "Yes" : "No"}</li>
                            <li>Violation Details: {application.violationDetails || "None"}</li>
                        </ul>
                    </div>
                );
            },
        },
        {
            title: "Verify Badge Tier Eligibility",
            description: "Ensure the badge tier eligibility is validated (if applicable).",
            content: (application) => {
                if (!application) return <p className="text-sm text-red-500">No application data available.</p>;
                return (
                    <div>
                        <p className="text-sm text-gray-700 mb-4">
                            <strong>Badge Tier Details:</strong>
                        </p>
                        <ul className="list-disc pl-6 text-sm text-gray-600">
                            <li>Badge Tier: {application.badgeTier || "N/A"}</li>
                            <li>Eligibility Status: {application.badgeEligibility ? "Eligible" : "Not Eligible"}</li>
                        </ul>
                    </div>
                );
            },
        },
    ];

    useEffect(() => {
        const stored = storage.get('permits') || [];
        setPermits(stored);

        // Fetch submitted applications from localStorage
        const vehicles = storage.get("vehicleApplications") || [];
        const drivers = storage.get("driverPermits") || [];
        setVehicleApplications(vehicles);
        setDriverApplications(drivers);
    }, []);

    // Derived lists
    const expiringPermits = useMemo(() => {
        const list = [];
        const now = new Date();
        const withinDays = (dateStr, days = 30) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            const diffDays = (d - now) / (1000 * 60 * 60 * 24);
            return diffDays <= days && diffDays >= -3650; // allow dates in the past (EXPIRED) as well
        };

        permits.forEach(p => {
            // pick an expiry date to show: licenseExpiry > insuranceExpiry > last schedule date
            let expiry = p.licenseExpiry || p.insuranceExpiry || '';
            if ((!expiry || expiry === '') && Array.isArray(p.schedule) && p.schedule.length > 0) {
                expiry = p.schedule[p.schedule.length - 1].date;
            }

            if (expiry) {
                list.push({
                    id: p.id,
                    driver: p.driverName,
                    vehicle: p.vehiclePlate,
                    status: p.status || 'N/A',
                    expiry: expiry
                });
            }
        });

        // sort by soonest expiry and return a top slice
        list.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
        return list.slice(0, 6);
    }, [permits]);

    const suspendedPermits = useMemo(() => {
        return permits.filter(p => p.driverSuspended || (p.status && (p.status.toLowerCase() === 'suspended' || p.status.toLowerCase() === 'revoked')))
            .map(p => ({ id: p.id, driver: p.driverName, vehicle: p.vehiclePlate, status: p.status, expiry: p.licenseExpiry }));
    }, [permits]);

    const handleApprove = (id, type) => {
        if (type === "vehicle") {
            const updatedApplications = vehicleApplications.map(app =>
                app.id === id ? { ...app, status: "Approved" } : app
            );
            setVehicleApplications(updatedApplications);
            storage.set("vehicleApplications", updatedApplications);
        } else if (type === "driver") {
            const updatedApplications = driverApplications.map(app =>
                app.id === id ? { ...app, status: "Approved" } : app
            );
            setDriverApplications(updatedApplications);
            storage.set("driverPermits", updatedApplications);
        }
    };

    const handleReject = (id, type) => {
        if (type === "vehicle") {
            const updatedApplications = vehicleApplications.map(app =>
                app.id === id ? { ...app, status: "Rejected" } : app
            );
            setVehicleApplications(updatedApplications);
            storage.set("vehicleApplications", updatedApplications);
        } else if (type === "driver") {
            const updatedApplications = driverApplications.map(app =>
                app.id === id ? { ...app, status: "Rejected" } : app
            );
            setDriverApplications(updatedApplications);
            storage.set("driverPermits", updatedApplications);
        }
    };

    const filteredVehicleApplications = useMemo(() => {
        return vehicleApplications.filter(app =>
            app.fullName.toLowerCase().includes(searchVehicle.toLowerCase()) ||
            app.licensePlate.toLowerCase().includes(searchVehicle.toLowerCase()) ||
            app.status?.toLowerCase().includes(searchVehicle.toLowerCase())
        );
    }, [vehicleApplications, searchVehicle]);

    const filteredDriverApplications = useMemo(() => {
        return driverApplications.filter(app =>
            app.fullName.toLowerCase().includes(searchDriver.toLowerCase()) ||
            app.licenseNumber?.toLowerCase().includes(searchDriver.toLowerCase()) ||
            app.status?.toLowerCase().includes(searchDriver.toLowerCase())
        );
    }, [driverApplications, searchDriver]);

    const openVehicleDialog = (application) => {
        if (!application) {
            console.error("No application data provided.");
            return;
        }
        setSelectedVehicleApplication(application);
        setCurrentStep(0);
        setIsVehicleDialogOpen(true);
    };

    const closeVehicleDialog = () => {
        setIsVehicleDialogOpen(false);
        setSelectedVehicleApplication(null);
        setCurrentStep(0);
    };

    const handleNextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleVehicleApproval = () => {
        if (!selectedVehicleApplication) {
            console.error("No vehicle application selected for approval.");
            return;
        }
        handleApprove(selectedVehicleApplication.id, "vehicle");
        closeVehicleDialog();
    };

    const openDriverDialog = (application) => {
        if (!application) {
            console.error("No application data provided.");
            return;
        }
        setSelectedDriverApplication(application);
        setCurrentDriverStep(0);
        setIsDriverDialogOpen(true);
    };

    const closeDriverDialog = () => {
        setIsDriverDialogOpen(false);
        setSelectedDriverApplication(null);
        setCurrentDriverStep(0);
    };

    const handleNextDriverStep = () => {
        if (currentDriverStep < driverSteps.length - 1) {
            setCurrentDriverStep((prev) => prev + 1);
        }
    };

    const handleDriverApproval = () => {
        if (!selectedDriverApplication) {
            console.error("No driver application selected for approval.");
            return;
        }
        handleApprove(selectedDriverApplication.id, "driver");
        closeDriverDialog();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex flex-col">
            {/* NAVBAR */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-indigo-700">
                        <Shield className="w-8 h-8 fill-current" />
                        <span className="text-xl font-bold tracking-tight">TLC Registry</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <button className="text-slate-500 hover:text-slate-700 transition-colors">
                        <Grid className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4">
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
            </nav >

            <div className="flex flex-1">
                {/* SIDEBAR */}
                <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col py-6 px-4 hidden lg:flex sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
                    <nav className="space-y-1">
                        {sidebarOptions.map(opt => (
                            <button
                                key={opt.label}
                                onClick={() => setActiveSidebar(opt.label)}
                                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium transition-all ${activeSidebar === opt.label
                                    ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                <div className="flex items-center">
                                    {React.cloneElement(opt.icon, { className: `w-5 h-5 mr-3 ${activeSidebar === opt.label ? 'text-indigo-600' : 'text-slate-400'}` })}
                                    {opt.label}
                                </div>
                                {opt.badge && (
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {opt.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
                    {activeSidebar === "Dashboard" && (
                        <>
                            <div className="max-w-7xl mx-auto">
                                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2 tracking-tight">Permit Registry Dashboard</h1>
                                <p className="text-slate-600 mb-8">Monitor and manage TLC permits</p>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                    {/* Expiring Soon Card */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-0 overflow-hidden">
                                        <div className="p-6 border-b border-slate-100 bg-amber-50/50">
                                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-amber-600" />
                                                Expiring Soon
                                            </h2>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {expiringPermits.length === 0 ? (
                                                        <tr><td colSpan={3} className="py-8 text-center text-slate-500">No upcoming expiries</td></tr>
                                                    ) : (
                                                        expiringPermits.map((p, i) => (
                                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                <td className="py-3 px-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                                                            <User className="w-4 h-4" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-medium text-slate-900">{p.driver}</div>
                                                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                                <Car className="w-3 h-3" /> {p.vehicle}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-6">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${(new Date(p.expiry) < new Date()) ? 'bg-red-50 text-red-700 border-red-200' :
                                                                        p.status && p.status.toLowerCase().includes('approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                            p.status && (p.status.toLowerCase().includes('rejected') || p.status.toLowerCase().includes('suspended')) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        }`}>
                                                                        {p.status ? p.status.toUpperCase() : (new Date(p.expiry) < new Date() ? 'EXPIRED' : 'N/A')}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-6 text-slate-600 font-mono text-xs">{p.expiry ? new Date(p.expiry).toLocaleDateString() : '-'}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Suspended/Revoked Card */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-0 overflow-hidden">
                                        <div className="p-6 border-b border-slate-100 bg-red-50/50">
                                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                <AlertCircle className="w-5 h-5 text-red-600" />
                                                Suspended / Revoked
                                            </h2>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                        <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {suspendedPermits.length === 0 ? (
                                                        <tr><td colSpan={3} className="py-8 text-center text-slate-500">No suspended permits</td></tr>
                                                    ) : (
                                                        suspendedPermits.map((p, i) => (
                                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                                <td className="py-3 px-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                                                            <User className="w-4 h-4" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-medium text-slate-900">{p.driver}</div>
                                                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                                                <Car className="w-3 h-3" /> {p.vehicle}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-6">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                                        {p.status ? p.status.toUpperCase() : 'SUSPENDED'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-6 text-slate-600 font-mono text-xs">{p.expiry ? new Date(p.expiry).toLocaleDateString() : '-'}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Analytics Snapshot Card */}
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700 p-6 flex flex-col justify-between text-white">
                                        <h2 className="text-lg font-bold mb-4">Analytics Snapshot</h2>
                                        <div className="flex-1 flex items-center justify-center">
                                            {/* Placeholder for chart/graph */}
                                            <div className="text-center">
                                                <BarChart2 className="w-16 h-16 mx-auto mb-3 text-slate-400" />
                                                <p className="text-sm text-slate-400">Key metrics and trends</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                                                <div className="text-2xl font-bold">{permits.length}</div>
                                                <div className="text-xs text-slate-400">Total Permits</div>
                                            </div>
                                            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                                                <div className="text-2xl font-bold text-emerald-400">{permits.filter(p => p.status && p.status.toLowerCase().includes('approved')).length}</div>
                                                <div className="text-xs text-slate-400">Approved</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    {activeSidebar === "Search Permits" && (
                        <SearchPermit />
                    )}
                    {activeSidebar === "Pairing Wizard" && (
                        <PairingWizard user={user} />
                    )}
                    {activeSidebar === "Entity Details" && (
                        <EntityDetail />
                    )}
                    {activeSidebar === "Admin Configuration" && (
                        <AdminConfiguration />
                    )}
                    {activeSidebar === "Analytics & BI Hub" && (
                        <AnalyticsBIHub />
                    )}

                    {/* Approve Permits Tab */}
                    {activeSidebar === "Approve Permits" && (
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Approve Submitted Applications</h1>

                            <Tab.Group>
                                <Tab.List className="flex space-x-4 border-b border-gray-200 mb-6">
                                    <Tab
                                        className={({ selected }) =>
                                            `px-6 py-2 text-sm font-semibold rounded-t-lg ${selected
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`
                                        }
                                    >
                                        Vehicle Applications
                                    </Tab>
                                    <Tab
                                        className={({ selected }) =>
                                            `px-6 py-2 text-sm font-semibold rounded-t-lg ${selected
                                                ? "bg-indigo-600 text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`
                                        }
                                    >
                                        Driver Applications
                                    </Tab>
                                </Tab.List>
                                <Tab.Panels>
                                    {/* Vehicle Applications Panel */}
                                    <Tab.Panel>
                                        <div className="mb-6">
                                            <input
                                                type="text"
                                                placeholder="Search by applicant, license plate, or status..."
                                                value={searchVehicle}
                                                onChange={(e) => setSearchVehicle(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        {filteredVehicleApplications.length === 0 ? (
                                            <p className="text-gray-600">No vehicle applications found.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full border-collapse rounded-xl overflow-hidden shadow-lg">
                                                    <thead>
                                                        <tr className="bg-gradient-to-r from-blue-100 to-green-100">
                                                            <th className="p-4 text-left text-sm font-bold text-blue-800">ID</th>
                                                            <th className="p-4 text-left text-sm font-bold text-blue-800">Applicant</th>
                                                            <th className="p-4 text-left text-sm font-bold text-blue-800">Vehicle</th>
                                                            <th className="p-4 text-left text-sm font-bold text-blue-800">Status</th>
                                                            <th className="p-4 text-left text-sm font-bold text-blue-800">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredVehicleApplications.map(app => (
                                                            <tr key={app.id} className="border-b hover:bg-blue-50 transition">
                                                                <td className="p-4 text-sm font-mono">{app.id}</td>
                                                                <td className="p-4 text-sm">{app.fullName}</td>
                                                                <td className="p-4 text-sm">
                                                                    {app.licensePlate} ({app.make} {app.model}, {app.year})
                                                                </td>
                                                                <td className="p-4 text-sm">
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${app.status === "Approved"
                                                                        ? "bg-green-200 text-green-800"
                                                                        : app.status === "Rejected"
                                                                            ? "bg-red-200 text-red-800"
                                                                            : "bg-orange-200 text-orange-800"
                                                                        }`}>
                                                                        {app.status || "Pending"}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-sm">
                                                                    <button
                                                                        onClick={() => openVehicleDialog(app)}
                                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                                                                    >
                                                                        Review
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </Tab.Panel>

                                    {/* Driver Applications Panel */}
                                    <Tab.Panel>
                                        <div className="mb-6">
                                            <input
                                                type="text"
                                                placeholder="Search by driver name, license number, or status..."
                                                value={searchDriver}
                                                onChange={(e) => setSearchDriver(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        {filteredDriverApplications.length === 0 ? (
                                            <p className="text-gray-600">No driver applications found.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full border-collapse rounded-xl overflow-hidden shadow-lg">
                                                    <thead>
                                                        <tr className="bg-gradient-to-r from-indigo-100 to-green-100">
                                                            <th className="p-4 text-left text-sm font-bold text-indigo-800">ID</th>
                                                            <th className="p-4 text-left text-sm font-bold text-indigo-800">Driver Name</th>
                                                            <th className="p-4 text-left text-sm font-bold text-indigo-800">License #</th>
                                                            <th className="p-4 text-left text-sm font-bold text-indigo-800">Status</th>
                                                            <th className="p-4 text-left text-sm font-bold text-indigo-800">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredDriverApplications.map(app => (
                                                            <tr key={app.id} className="border-b hover:bg-green-50 transition">
                                                                <td className="p-4 text-sm font-mono">{app.id}</td>
                                                                <td className="p-4 text-sm">{app.fullName}</td>
                                                                <td className="p-4 text-sm">{app.licenseNumber || "N/A"}</td>
                                                                <td className="p-4 text-sm">
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${app.status === "Approved"
                                                                        ? "bg-green-200 text-green-800"
                                                                        : app.status === "Rejected"
                                                                            ? "bg-red-200 text-red-800"
                                                                            : "bg-orange-200 text-orange-800"
                                                                        }`}>
                                                                        {app.status || "Pending"}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-sm">
                                                                    <button
                                                                        onClick={() => openDriverDialog(app)}
                                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                                                                    >
                                                                        Review
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </Tab.Panel>
                                </Tab.Panels>
                            </Tab.Group>
                        </div>
                    )}

                    {/* Vehicle Approval Dialog */}
                    <Transition appear show={isVehicleDialogOpen} as={React.Fragment}>
                        <Dialog as="div" className="relative z-10" onClose={closeVehicleDialog}>
                            <Transition.Child
                                as={React.Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 bg-black bg-opacity-25" />
                            </Transition.Child>

                            <div className="fixed inset-0 overflow-y-auto">
                                <div className="flex items-center justify-center min-h-full p-4 text-center">
                                    <Transition.Child
                                        as={React.Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                    >
                                        <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                            <Dialog.Title
                                                as="h3"
                                                className="text-lg font-medium leading-6 text-gray-900"
                                            >
                                                {steps[currentStep]?.title || "Review Application"}
                                            </Dialog.Title>
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-500 mb-4">
                                                    {steps[currentStep]?.description || "No description available."}
                                                </p>
                                                {steps[currentStep]?.content(selectedVehicleApplication)}
                                            </div>

                                            <div className="mt-6 flex justify-between">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                                    onClick={closeVehicleDialog}
                                                >
                                                    Cancel
                                                </button>
                                                {currentStep < steps.length - 1 ? (
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                                        onClick={handleNextStep}
                                                    >
                                                        Next Step <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                                                        onClick={handleVehicleApproval}
                                                    >
                                                        Approve Application
                                                    </button>
                                                )}
                                            </div>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition>

                    {/* Driver Approval Dialog */}
                    <Transition appear show={isDriverDialogOpen} as={React.Fragment}>
                        <Dialog as="div" className="relative z-10" onClose={closeDriverDialog}>
                            <Transition.Child
                                as={React.Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 bg-black bg-opacity-25" />
                            </Transition.Child>

                            <div className="fixed inset-0 overflow-y-auto">
                                <div className="flex items-center justify-center min-h-full p-4 text-center">
                                    <Transition.Child
                                        as={React.Fragment}
                                        enter="ease-out duration-300"
                                        enterFrom="opacity-0 scale-95"
                                        enterTo="opacity-100 scale-100"
                                        leave="ease-in duration-200"
                                        leaveFrom="opacity-100 scale-100"
                                        leaveTo="opacity-0 scale-95"
                                    >
                                        <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                            <Dialog.Title
                                                as="h3"
                                                className="text-lg font-medium leading-6 text-gray-900"
                                            >
                                                {driverSteps[currentDriverStep]?.title || "Review Application"}
                                            </Dialog.Title>
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-500 mb-4">
                                                    {driverSteps[currentDriverStep]?.description || "No description available."}
                                                </p>
                                                {driverSteps[currentDriverStep]?.content(selectedDriverApplication)}
                                            </div>

                                            <div className="mt-6 flex justify-between">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                                    onClick={closeDriverDialog}
                                                >
                                                    Cancel
                                                </button>
                                                {currentDriverStep < driverSteps.length - 1 ? (
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                                        onClick={handleNextDriverStep}
                                                    >
                                                        Next Step <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                                                        onClick={handleDriverApproval}
                                                    >
                                                        Approve Application
                                                    </button>
                                                )}
                                            </div>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition>
                </main>
            </div>
        </div >
    );
}
