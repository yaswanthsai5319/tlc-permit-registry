'use client';

import { useState } from 'react';
import { ClipboardList, CheckCircle, User, Car, FileText, Shield, LogOut, Search } from 'lucide-react';
import { storage } from '../utils/storage';

const MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Volkswagen', 'Other'];
const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
const BASES = ['XYZ Dispatch', 'ABC Base', '123 Fleet', 'No Affiliation'];
const DRIVER_STATES = ['NY', 'NJ', 'CT', 'PA', 'Other'];
const BADGE_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];

const VEHICLE_FORM_TABS = [
    { key: 'applicant', label: 'Applicant Info', icon: <User className="inline-block w-4 h-4 mr-1" /> },
    { key: 'vehicle', label: 'Vehicle Details', icon: <Car className="inline-block w-4 h-4 mr-1" /> },
    { key: 'compliance', label: 'Compliance', icon: <Shield className="inline-block w-4 h-4 mr-1" /> },
    { key: 'preview', label: 'Preview & Verify', icon: <FileText className="inline-block w-4 h-4 mr-1" /> }
];

const DRIVER_FORM_TABS = [
    { key: 'driver', label: 'Driver Info', icon: <User className="inline-block w-4 h-4 mr-1" /> },
    { key: 'compliance', label: 'Compliance', icon: <Shield className="inline-block w-4 h-4 mr-1" /> },
    { key: 'declaration', label: 'Declaration', icon: <CheckCircle className="inline-block w-4 h-4 mr-1" /> },
    { key: 'preview', label: 'Preview & Verify', icon: <FileText className="inline-block w-4 h-4 mr-1" /> }
];

export default function FleetOwnerHome({ user, onLogout }) {
    const [activePanel, setActivePanel] = useState('apply');
    const [activeVehicleTab, setActiveVehicleTab] = useState('applicant');
    const [activeDriverTab, setActiveDriverTab] = useState('driver');
    const [formData, setFormData] = useState({
        applicantType: 'Fleet Owner',
        fullName: '',
        contactPhone: '',
        email: '',
        organization: '',
        licensePlate: '',
        vin: '',
        make: '',
        model: '',
        year: '',
        color: '',
        usageType: '',
        insuranceBinder: null,
        inspectionCertificate: null,
        borough: 'Manhattan',
        baseAffiliation: '',
    });
    const [vehicleErrors, setVehicleErrors] = useState({});
    const [vehicleSuccess, setVehicleSuccess] = useState(false);

    const [driverForm, setDriverForm] = useState({
        fullName: '',
        licenseNumber: '',
        contactPhone: '',
        email: '',
        mailingAddress: '',
        ssn: '',
        driverLicense: null,
        stateOfIssuance: 'NY',
        badgeTier: 'Bronze',
        trainingCertificate: null,
        violationsDeclaration: '',
        medicalClearance: null,
        declaration: false,
        signature: ''
    });
    const [driverErrors, setDriverErrors] = useState({});
    const [driverSuccess, setDriverSuccess] = useState(false);

    // Search state for advanced search
    const [search, setSearch] = useState('');
    const [searchType, setSearchType] = useState('all');

    // File handlers
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData(prev => ({ ...prev, [name]: files[0] }));
    };
    const handleDriverFileChange = (e) => {
        const { name, files } = e.target;
        setDriverForm(prev => ({ ...prev, [name]: files[0] }));
    };

    // Input handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (vehicleErrors[name]) setVehicleErrors(prev => ({ ...prev, [name]: '' }));
    };
    const handleDriverChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setDriverForm(prev => ({ ...prev, [name]: checked }));
        } else {
            setDriverForm(prev => ({ ...prev, [name]: value }));
        }
        if (driverErrors[name]) setDriverErrors(prev => ({ ...prev, [name]: '' }));
    };

    // Tab-wise validation
    const validateVehicleTab = (tab) => {
        const newErrors = {};
        if (tab === 'applicant') {
            if (!formData.fullName) newErrors.fullName = 'Full name is required';
            if (!formData.contactPhone) newErrors.contactPhone = 'Contact phone is required';
            if (!formData.email) newErrors.email = 'Email is required';
        }
        if (tab === 'vehicle') {
            if (!formData.licensePlate) newErrors.licensePlate = 'License plate is required';
            if (!formData.vin) newErrors.vin = 'VIN is required';
            if (!formData.make) newErrors.make = 'Vehicle make is required';
            if (!formData.model) newErrors.model = 'Vehicle model is required';
            if (!formData.year) newErrors.year = 'Year is required';
            if (!formData.usageType) newErrors.usageType = 'Usage type is required';
        }
        if (tab === 'compliance') {
            if (!formData.insuranceBinder) newErrors.insuranceBinder = 'Insurance binder is required';
            if (!formData.inspectionCertificate) newErrors.inspectionCertificate = 'Inspection certificate is required';
            if (!formData.borough) newErrors.borough = 'Borough is required';
        }
        setVehicleErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateDriverTab = (tab) => {
        const errs = {};
        if (tab === 'driver') {
            if (!driverForm.fullName) errs.fullName = 'Full name is required';
            if (!driverForm.contactPhone) errs.contactPhone = 'Contact phone is required';
            if (!driverForm.email) errs.email = 'Email is required';
            if (!driverForm.mailingAddress) errs.mailingAddress = 'Mailing address is required';
            if (!driverForm.ssn) errs.ssn = 'Social Security Number is required';
            if (!driverForm.driverLicense) errs.driverLicense = 'Driver License document is required';
            if (!driverForm.stateOfIssuance) errs.stateOfIssuance = 'State of Issuance is required';
            if (!driverForm.badgeTier) errs.badgeTier = 'Badge Tier is required';
        }
        if (tab === 'compliance') {
            if (!driverForm.trainingCertificate) errs.trainingCertificate = 'Training Certificate is required';
            if (!driverForm.medicalClearance) errs.medicalClearance = 'Medical Clearance is required';
        }
        if (tab === 'declaration') {
            if (!driverForm.declaration) errs.declaration = 'You must declare that information is true';
            if (!driverForm.signature) errs.signature = 'Signature is required';
        }
        setDriverErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateVehicleForm = () => {
        let valid = true;
        VEHICLE_FORM_TABS.forEach(tab => {
            if (tab.key !== 'preview') {
                valid = validateVehicleTab(tab.key) && valid;
            }
        });
        return valid;
    };

    const validateDriverForm = () => {
        let valid = true;
        DRIVER_FORM_TABS.forEach(tab => {
            if (tab.key !== 'preview') {
                valid = validateDriverTab(tab.key) && valid;
            }
        });
        return valid;
    };

    // Tab navigation
    const handleNextVehicleTab = () => {
        if (activeVehicleTab !== 'preview' && !validateVehicleTab(activeVehicleTab)) return;
        const idx = VEHICLE_FORM_TABS.findIndex(t => t.key === activeVehicleTab);
        if (idx < VEHICLE_FORM_TABS.length - 1) {
            setActiveVehicleTab(VEHICLE_FORM_TABS[idx + 1].key);
        }
    };
    const handlePrevVehicleTab = () => {
        const idx = VEHICLE_FORM_TABS.findIndex(t => t.key === activeVehicleTab);
        if (idx > 0) {
            setActiveVehicleTab(VEHICLE_FORM_TABS[idx - 1].key);
        }
    };
    const handleNextDriverTab = () => {
        if (activeDriverTab !== 'preview' && !validateDriverTab(activeDriverTab)) return;
        const idx = DRIVER_FORM_TABS.findIndex(t => t.key === activeDriverTab);
        if (idx < DRIVER_FORM_TABS.length - 1) {
            setActiveDriverTab(DRIVER_FORM_TABS[idx + 1].key);
        }
    };
    const handlePrevDriverTab = () => {
        const idx = DRIVER_FORM_TABS.findIndex(t => t.key === activeDriverTab);
        if (idx > 0) {
            setActiveDriverTab(DRIVER_FORM_TABS[idx - 1].key);
        }
    };

    // Submit handlers
    const handleVehicleSubmit = (e) => {
        e.preventDefault();
        if (!validateVehicleForm()) {
            setActiveVehicleTab(VEHICLE_FORM_TABS.find(tab => Object.keys(vehicleErrors).some(field => vehicleTabFields[tab.key]?.includes(field))).key);
            return;
        }
        const applications = storage.get('vehicleApplications') || [];
        const newApp = {
            id: Date.now().toString(),
            ...formData,
            status: 'Pending',
            submittedBy: user?.username || '',
            submittedAt: new Date().toISOString(),
        };
        applications.push(newApp);
        storage.set('vehicleApplications', applications);

        setVehicleSuccess(true);
        setFormData({
            applicantType: 'Fleet Owner',
            fullName: '',
            contactPhone: '',
            email: '',
            organization: '',
            licensePlate: '',
            vin: '',
            make: '',
            model: '',
            year: '',
            color: '',
            usageType: '',
            insuranceBinder: null,
            inspectionCertificate: null,
            borough: 'Manhattan',
            baseAffiliation: '',
        });
        setActiveVehicleTab('applicant');
    };

    const handleDriverSubmit = (e) => {
        e.preventDefault();
        if (!validateDriverForm()) {
            setActiveDriverTab(DRIVER_FORM_TABS.find(tab => Object.keys(driverErrors).some(field => driverTabFields[tab.key]?.includes(field))).key);
            return;
        }
        const driverPermits = storage.get('driverPermits') || [];
        const newPermit = {
            id: Date.now().toString(),
            ...driverForm,
            submittedBy: user?.username || '',
            submittedAt: new Date().toISOString(),
            status: 'Pending'
        };
        driverPermits.push(newPermit);
        storage.set('driverPermits', driverPermits);

        setDriverSuccess(true);
        setDriverForm({
            fullName: '',
            licenseNumber: '',
            contactPhone: '',
            email: '',
            mailingAddress: '',
            ssn: '',
            driverLicense: null,
            stateOfIssuance: 'NY',
            badgeTier: 'Bronze',
            trainingCertificate: null,
            violationsDeclaration: '',
            medicalClearance: null,
            declaration: false,
            signature: ''
        });
        setActiveDriverTab('driver');
    };

    // Tab fields for error navigation
    const vehicleTabFields = {
        applicant: ['fullName', 'contactPhone', 'email'],
        vehicle: ['licensePlate', 'vin', 'make', 'model', 'year', 'usageType'],
        compliance: ['insuranceBinder', 'inspectionCertificate', 'borough'],
        preview: []
    };
    const driverTabFields = {
        driver: ['fullName', 'contactPhone', 'email', 'mailingAddress', 'ssn', 'driverLicense', 'stateOfIssuance', 'badgeTier'],
        compliance: ['trainingCertificate', 'medicalClearance'],
        declaration: ['declaration', 'signature'],
        preview: []
    };

    // Data for tables
    const applications = storage.get('vehicleApplications') || [];
    const myApplications = applications.filter(app => app.submittedBy === user?.username);
    const driverPermits = storage.get('driverPermits') || [];
    const myDriverPermits = driverPermits.filter(p => p.submittedBy === user?.username);

    // Advanced search filter
    const filteredVehicleApps = myApplications.filter(app => {
        if (searchType === 'all' || searchType === 'vehicle') {
            return (
                app.fullName.toLowerCase().includes(search.toLowerCase()) ||
                app.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
                app.status.toLowerCase().includes(search.toLowerCase())
            );
        }
        return false;
    });
    const filteredDriverApps = myDriverPermits.filter(app => {
        if (searchType === 'all' || searchType === 'driver') {
            return (
                app.fullName.toLowerCase().includes(search.toLowerCase()) ||
                (app.licenseNumber || '').toLowerCase().includes(search.toLowerCase()) ||
                app.status.toLowerCase().includes(search.toLowerCase())
            );
        }
        return false;
    });

    // Sidebar tabs
    const sidebarTabs = [
        { key: 'apply', label: 'Apply for Vehicle Permit', icon: <ClipboardList className="w-5 h-5" /> },
        { key: 'driver', label: 'Apply for Driver Permit', icon: <User className="w-5 h-5" /> },
        { key: 'list', label: 'List of Applications', icon: <FileText className="w-5 h-5" /> }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 shadow-lg flex flex-col py-8 px-4">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-slate-900">TLC Permit Registry</h1>
                    <p className="text-slate-600 text-sm">Fleet Owner Portal</p>
                </div>
                <nav className="flex flex-col gap-2">
                    {sidebarTabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                                activePanel === tab.key
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                            }`}
                            onClick={() => {
                                setActivePanel(tab.key);
                                setVehicleSuccess(false);
                                setDriverSuccess(false);
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 relative">
                {/* Logout button at top right */}
                <div className="absolute top-8 right-8">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-md transition-all font-semibold"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
                {activePanel === 'apply' && (
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-blue-900 text-center">VEHICLE PERMIT APPLICATION FORM</h2>
                        <form onSubmit={handleVehicleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                            {/* Tab Navigation */}
                            <div className="flex gap-2 mb-8 justify-center">
                                {VEHICLE_FORM_TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all border ${activeVehicleTab === tab.key ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                                        onClick={() => setActiveVehicleTab(tab.key)}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            {/* Tab Panels */}
                            {activeVehicleTab === 'applicant' && (
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Applicant Type</label>
                                        <select name="applicantType" value={formData.applicantType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                            <option value="Fleet Owner">Fleet Owner</option>
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {vehicleErrors.fullName && <p className="text-red-600 text-sm">{vehicleErrors.fullName}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone *</label>
                                        <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="+1" />
                                        {vehicleErrors.contactPhone && <p className="text-red-600 text-sm">{vehicleErrors.contactPhone}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="owner@example.com" />
                                        {vehicleErrors.email && <p className="text-red-600 text-sm">{vehicleErrors.email}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name (if applicable)</label>
                                        <input type="text" name="organization" value={formData.organization} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="XYZ Fleet" />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700" onClick={handleNextVehicleTab}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeVehicleTab === 'vehicle' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">License Plate *</label>
                                        <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="ABC1234" />
                                        {vehicleErrors.licensePlate && <p className="text-red-600 text-sm">{vehicleErrors.licensePlate}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">VIN *</label>
                                        <input type="text" name="vin" value={formData.vin} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="1FTFX12345ABCDE1234" />
                                        {vehicleErrors.vin && <p className="text-red-600 text-sm">{vehicleErrors.vin}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Make *</label>
                                        <select name="make" value={formData.make} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                            <option value="">Select</option>
                                            {MAKES.map(make => <option key={make} value={make}>{make}</option>)}
                                        </select>
                                        {vehicleErrors.make && <p className="text-red-600 text-sm">{vehicleErrors.make}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Model *</label>
                                        <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Camry" />
                                        {vehicleErrors.model && <p className="text-red-600 text-sm">{vehicleErrors.model}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
                                        <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="2018" />
                                        {vehicleErrors.year && <p className="text-red-600 text-sm">{vehicleErrors.year}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Color (Optional)</label>
                                        <input type="text" name="color" value={formData.color} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="White" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Usage Type *</label>
                                        <input type="text" name="usageType" value={formData.usageType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Taxi" />
                                        {vehicleErrors.usageType && <p className="text-red-600 text-sm">{vehicleErrors.usageType}</p>}
                                    </div>
                                    <div></div>
                                    <div className="md:col-span-2 flex justify-between gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300" onClick={handlePrevVehicleTab}>
                                            Previous
                                        </button>
                                        <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700" onClick={handleNextVehicleTab}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeVehicleTab === 'compliance' && (
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Binder *</label>
                                        <input type="file" name="insuranceBinder" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {vehicleErrors.insuranceBinder && <p className="text-red-600 text-sm">{vehicleErrors.insuranceBinder}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Inspection Certificate *</label>
                                        <input type="file" name="inspectionCertificate" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {vehicleErrors.inspectionCertificate && <p className="text-red-600 text-sm">{vehicleErrors.inspectionCertificate}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Borough *</label>
                                        <select name="borough" value={formData.borough} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                            {BOROUGHS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                        {vehicleErrors.borough && <p className="text-red-600 text-sm">{vehicleErrors.borough}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Base Affiliation (Optional)</label>
                                        <select name="baseAffiliation" value={formData.baseAffiliation} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                            <option value="">Select</option>
                                            {BASES.map(base => <option key={base} value={base}>{base}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex justify-between gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300" onClick={handlePrevVehicleTab}>
                                            Previous
                                        </button>
                                        <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700" onClick={handleNextVehicleTab}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeVehicleTab === 'preview' && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Preview & Verify Your Application</h3>
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <h4 className="font-semibold text-blue-700 mb-2">Applicant Info</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="font-semibold">Applicant Type:</span> {formData.applicantType}</div>
                                            <div><span className="font-semibold">Full Name:</span> {formData.fullName}</div>
                                            <div><span className="font-semibold">Contact Phone:</span> {formData.contactPhone}</div>
                                            <div><span className="font-semibold">Email:</span> {formData.email}</div>
                                            <div><span className="font-semibold">Organization:</span> {formData.organization}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <h4 className="font-semibold text-blue-700 mb-2">Vehicle Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="font-semibold">License Plate:</span> {formData.licensePlate}</div>
                                            <div><span className="font-semibold">VIN:</span> {formData.vin}</div>
                                            <div><span className="font-semibold">Make:</span> {formData.make}</div>
                                            <div><span className="font-semibold">Model:</span> {formData.model}</div>
                                            <div><span className="font-semibold">Year:</span> {formData.year}</div>
                                            <div><span className="font-semibold">Color:</span> {formData.color}</div>
                                            <div><span className="font-semibold">Usage Type:</span> {formData.usageType}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <h4 className="font-semibold text-blue-700 mb-2">Compliance</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold">Insurance Binder:</span>
                                                {formData.insuranceBinder ? (
                                                    <span className="ml-2 text-green-700">Uploaded: {formData.insuranceBinder.name}</span>
                                                ) : (
                                                    <span className="ml-2 text-red-700">Not uploaded</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-semibold">Inspection Certificate:</span>
                                                {formData.inspectionCertificate ? (
                                                    <span className="ml-2 text-green-700">Uploaded: {formData.inspectionCertificate.name}</span>
                                                ) : (
                                                    <span className="ml-2 text-red-700">Not uploaded</span>
                                                )}
                                            </div>
                                            <div><span className="font-semibold">Borough:</span> {formData.borough}</div>
                                            <div><span className="font-semibold">Base Affiliation:</span> {formData.baseAffiliation}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300" onClick={handlePrevVehicleTab}>
                                            Previous
                                        </button>
                                        <button type="submit" className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
                                            Submit Application
                                        </button>
                                    </div>
                                    {vehicleSuccess && (
                                        <div className="mt-6 bg-green-50 border border-green-400 text-green-800 p-4 rounded-xl flex items-center shadow-lg">
                                            <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                                            <div>
                                                <p className="font-semibold">Application submitted successfully!</p>
                                                <p className="text-sm">You can check your application status in the left panel.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>
                )}
                {activePanel === 'driver' && (
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-blue-900 text-center">DRIVER PERMIT APPLICATION FORM</h2>
                        <form onSubmit={handleDriverSubmit} className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                            {/* Tab Navigation */}
                            <div className="flex gap-2 mb-8 justify-center">
                                {DRIVER_FORM_TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all border ${activeDriverTab === tab.key ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                                        onClick={() => setActiveDriverTab(tab.key)}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            {/* Tab Panels */}
                            {activeDriverTab === 'driver' && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                        <input type="text" name="fullName" value={driverForm.fullName} onChange={handleDriverChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {driverErrors.fullName && <p className="text-red-600 text-sm">{driverErrors.fullName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">License Number (if applicable)</label>
                                        <input type="text" name="licenseNumber" value={driverForm.licenseNumber} onChange={handleDriverChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="TLC123456" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone *</label>
                                        <input type="tel" name="contactPhone" value={driverForm.contactPhone} onChange={handleDriverChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="+1" />
                                        {driverErrors.contactPhone && <p className="text-red-600 text-sm">{driverErrors.contactPhone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                        <input type="email" name="email" value={driverForm.email} onChange={handleDriverChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="driver@example.com" />
                                        {driverErrors.email && <p className="text-red-600 text-sm">{driverErrors.email}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Mailing Address *</label>
                                        <input type="text" name="mailingAddress" value={driverForm.mailingAddress} onChange={handleDriverChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="123 Elm Street, NY 10001" />
                                        {driverErrors.mailingAddress && <p className="text-red-600 text-sm">{driverErrors.mailingAddress}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Social Security Number *</label>
                                        <input type="text" name="ssn" value={driverForm.ssn} onChange={handleDriverChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {driverErrors.ssn && <p className="text-red-600 text-sm">{driverErrors.ssn}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Driver License *</label>
                                        <input type="file" name="driverLicense" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDriverFileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {driverErrors.driverLicense && <p className="text-red-600 text-sm">{driverErrors.driverLicense}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">State of Issuance *</label>
                                        <select name="stateOfIssuance" value={driverForm.stateOfIssuance} onChange={handleDriverChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                            {DRIVER_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                                        </select>
                                        {driverErrors.stateOfIssuance && <p className="text-red-600 text-sm">{driverErrors.stateOfIssuance}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Badge Tier *</label>
                                        <select name="badgeTier" value={driverForm.badgeTier} onChange={handleDriverChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                            {BADGE_TIERS.map(tier => <option key={tier} value={tier}>{tier}</option>)}
                                        </select>
                                        {driverErrors.badgeTier && <p className="text-red-600 text-sm">{driverErrors.badgeTier}</p>}
                                    </div>
                                    <div className="md:col-span-2 flex justify-end gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700" onClick={handleNextDriverTab}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeDriverTab === 'compliance' && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Training Certificate *</label>
                                        <input type="file" name="trainingCertificate" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDriverFileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {driverErrors.trainingCertificate && <p className="text-red-600 text-sm">{driverErrors.trainingCertificate}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Violations Declaration</label>
                                        <input type="text" name="violationsDeclaration" value={driverForm.violationsDeclaration} onChange={handleDriverChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="None" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Medical Clearance *</label>
                                        <input type="file" name="medicalClearance" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDriverFileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {driverErrors.medicalClearance && <p className="text-red-600 text-sm">{driverErrors.medicalClearance}</p>}
                                    </div>
                                    <div></div>
                                    <div className="md:col-span-2 flex justify-between gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300" onClick={handlePrevDriverTab}>
                                            Previous
                                        </button>
                                        <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700" onClick={handleNextDriverTab}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeDriverTab === 'declaration' && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Declaration</h3>
                                    <div className="mb-4 flex items-center gap-2">
                                        <input type="checkbox" name="declaration" checked={driverForm.declaration} onChange={handleDriverChange} className="h-5 w-5" />
                                        <label className="text-sm font-semibold text-gray-700">I declare that information is true.</label>
                                        {driverErrors.declaration && <p className="text-red-600 text-sm ml-2">{driverErrors.declaration}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Signature *</label>
                                        <input type="text" name="signature" value={driverForm.signature} onChange={handleDriverChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {driverErrors.signature && <p className="text-red-600 text-sm">{driverErrors.signature}</p>}
                                    </div>
                                    <div className="flex justify-between gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300" onClick={handlePrevDriverTab}>
                                            Previous
                                        </button>
                                        <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700" onClick={handleNextDriverTab}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeDriverTab === 'preview' && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Preview & Verify Your Application</h3>
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <h4 className="font-semibold text-blue-700 mb-2">Driver Info</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div><span className="font-semibold">Full Name:</span> {driverForm.fullName}</div>
                                            <div><span className="font-semibold">License Number:</span> {driverForm.licenseNumber}</div>
                                            <div><span className="font-semibold">Contact Phone:</span> {driverForm.contactPhone}</div>
                                            <div><span className="font-semibold">Email:</span> {driverForm.email}</div>
                                            <div><span className="font-semibold">Mailing Address:</span> {driverForm.mailingAddress}</div>
                                            <div><span className="font-semibold">Social Security Number:</span> {driverForm.ssn}</div>
                                            <div>
                                                <span className="font-semibold">Driver License:</span>
                                                {driverForm.driverLicense ? (
                                                    <span className="ml-2 text-green-700">Uploaded: {driverForm.driverLicense.name}</span>
                                                ) : (
                                                    <span className="ml-2 text-red-700">Not uploaded</span>
                                                )}
                                            </div>
                                            <div><span className="font-semibold">State of Issuance:</span> {driverForm.stateOfIssuance}</div>
                                            <div><span className="font-semibold">Badge Tier:</span> {driverForm.badgeTier}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <h4 className="font-semibold text-blue-700 mb-2">Compliance</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold">Training Certificate:</span>
                                                {driverForm.trainingCertificate ? (
                                                    <span className="ml-2 text-green-700">Uploaded: {driverForm.trainingCertificate.name}</span>
                                                ) : (
                                                    <span className="ml-2 text-red-700">Not uploaded</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-semibold">Violations Declaration:</span> {driverForm.violationsDeclaration || 'None'}
                                            </div>
                                            <div>
                                                <span className="font-semibold">Medical Clearance:</span>
                                                {driverForm.medicalClearance ? (
                                                    <span className="ml-2 text-green-700">Uploaded: {driverForm.medicalClearance.name}</span>
                                                ) : (
                                                    <span className="ml-2 text-red-700">Not uploaded</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                        <h4 className="font-semibold text-blue-700 mb-2">Declaration</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold">Declaration:</span> {driverForm.declaration ? 'Yes' : 'No'}
                                            </div>
                                            <div>
                                                <span className="font-semibold">Signature:</span> {driverForm.signature}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300" onClick={handlePrevDriverTab}>
                                            Previous
                                        </button>
                                        <button type="submit" className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
                                            Submit Application
                                        </button>
                                    </div>
                                    {driverSuccess && (
                                        <div className="mt-6 bg-green-50 border border-green-400 text-green-800 p-4 rounded-xl flex items-center shadow-lg">
                                            <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                                            <div>
                                                <p className="font-semibold">Driver permit application submitted successfully!</p>
                                                <p className="text-sm">You can check your application status in the left panel.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>
                )}
                {activePanel === 'list' && (
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-blue-900 text-center">List of Applications</h2>
                        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                            {/* Advanced Search */}
                            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <Search className="w-5 h-5 text-blue-600" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search by name, plate, license, status..."
                                        className="px-4 py-2 border border-gray-300 rounded-lg w-full md:w-64"
                                    />
                                </div>
                                <select
                                    value={searchType}
                                    onChange={e => setSearchType(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="all">All</option>
                                    <option value="vehicle">Vehicle Permits</option>
                                    <option value="driver">Driver Permits</option>
                                </select>
                            </div>
                            {/* Vehicle Applications Table */}
                            {(searchType === 'all' || searchType === 'vehicle') && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-blue-700 mb-2">Vehicle Permit Applications</h3>
                                    {filteredVehicleApps.length === 0 ? (
                                        <p className="text-gray-600">No vehicle applications found.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border-collapse rounded-xl overflow-hidden shadow-lg">
                                                <thead>
                                                    <tr className="bg-gradient-to-r from-blue-100 to-green-100">
                                                        <th className="p-4 text-left text-sm font-bold text-blue-800">ID</th>
                                                        <th className="p-4 text-left text-sm font-bold text-blue-800">Applicant</th>
                                                        <th className="p-4 text-left text-sm font-bold text-blue-800">Vehicle</th>
                                                        <th className="p-4 text-left text-sm font-bold text-blue-800">Submitted At</th>
                                                        <th className="p-4 text-left text-sm font-bold text-blue-800">Status</th>
                                                        <th className="p-4 text-left text-sm font-bold text-blue-800">Borough</th>
                                                        <th className="p-4 text-left text-sm font-bold text-blue-800">Base Affiliation</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredVehicleApps.map(app => (
                                                        <tr key={app.id} className="border-b hover:bg-blue-50 transition">
                                                            <td className="p-4 text-sm font-mono">{app.id}</td>
                                                            <td className="p-4 text-sm">{app.fullName}</td>
                                                            <td className="p-4 text-sm">
                                                                <span className="font-semibold">{app.licensePlate}</span>
                                                                <span className="ml-2 text-gray-600">({app.make} {app.model}, {app.year})</span>
                                                            </td>
                                                            <td className="p-4 text-sm">{new Date(app.submittedAt).toLocaleString()}</td>
                                                            <td className="p-4 text-sm">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${app.status === 'Pending' ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}`}>
                                                                    {app.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-sm">{app.borough}</td>
                                                            <td className="p-4 text-sm">{app.baseAffiliation || <span className="text-gray-400">N/A</span>}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Driver Applications Table */}
                            {(searchType === 'all' || searchType === 'driver') && (
                                <div>
                                    <h3 className="text-lg font-bold text-indigo-700 mb-2">Driver Permit Applications</h3>
                                    {filteredDriverApps.length === 0 ? (
                                        <p className="text-gray-600">No driver applications found.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border-collapse rounded-xl overflow-hidden shadow-lg">
                                                <thead>
                                                    <tr className="bg-gradient-to-r from-indigo-100 to-green-100">
                                                        <th className="p-4 text-left text-sm font-bold text-indigo-800">ID</th>
                                                        <th className="p-4 text-left text-sm font-bold text-indigo-800">Driver Name</th>
                                                        <th className="p-4 text-left text-sm font-bold text-indigo-800">License #</th>
                                                        <th className="p-4 text-left text-sm font-bold text-indigo-800">Submitted At</th>
                                                        <th className="p-4 text-left text-sm font-bold text-indigo-800">Status</th>
                                                        <th className="p-4 text-left text-sm font-bold text-indigo-800">Badge Tier</th>
                                                        <th className="p-4 text-left text-sm font-bold text-indigo-800">State</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredDriverApps.map(permit => (
                                                        <tr key={permit.id} className="border-b hover:bg-green-50 transition">
                                                            <td className="p-4 text-sm font-mono">{permit.id}</td>
                                                            <td className="p-4 text-sm">{permit.fullName}</td>
                                                            <td className="p-4 text-sm">{permit.licenseNumber || <span className="text-gray-400">N/A</span>}</td>
                                                            <td className="p-4 text-sm">{new Date(permit.submittedAt).toLocaleString()}</td>
                                                            <td className="p-4 text-sm">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${permit.status === 'Pending' ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}`}>
                                                                    {permit.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-sm">{permit.badgeTier}</td>
                                                            <td className="p-4 text-sm">{permit.stateOfIssuance}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
