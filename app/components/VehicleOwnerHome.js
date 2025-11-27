'use client';

import { useState } from 'react';
import { ClipboardList, CheckCircle, User, Car, FileText, Shield, LogOut } from 'lucide-react';
import { storage } from '../utils/storage';

const MAKES = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Volkswagen', 'Other'];
const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
const BASES = ['XYZ Dispatch', 'ABC Base', '123 Fleet', 'No Affiliation'];

const FORM_TABS = [
    { key: 'applicant', label: 'Applicant Info', icon: <User className="inline-block w-4 h-4 mr-1" /> },
    { key: 'vehicle', label: 'Vehicle Details', icon: <Car className="inline-block w-4 h-4 mr-1" /> },
    { key: 'compliance', label: 'Compliance', icon: <Shield className="inline-block w-4 h-4 mr-1" /> },
    { key: 'preview', label: 'Preview & Verify', icon: <FileText className="inline-block w-4 h-4 mr-1" /> }
];

export default function VehicleOwnerHome({ user, onLogout }) {
    const [activePanel, setActivePanel] = useState('apply');
    const [activeFormTab, setActiveFormTab] = useState('applicant');
    const [formData, setFormData] = useState({
        applicantType: 'Vehicle Owner',
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
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);

    // For file uploads
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData(prev => ({ ...prev, [name]: files[0] }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    // Tab-wise validation
    const validateTab = (tab) => {
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
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateForm = () => {
        let valid = true;
        FORM_TABS.forEach(tab => {
            if (tab.key !== 'preview') {
                valid = validateTab(tab.key) && valid;
            }
        });
        return valid;
    };

    const handleNextTab = () => {
        if (activeFormTab !== 'preview' && !validateTab(activeFormTab)) return;
        const idx = FORM_TABS.findIndex(t => t.key === activeFormTab);
        if (idx < FORM_TABS.length - 1) {
            setActiveFormTab(FORM_TABS[idx + 1].key);
        }
    };

    const handlePrevTab = () => {
        const idx = FORM_TABS.findIndex(t => t.key === activeFormTab);
        if (idx > 0) {
            setActiveFormTab(FORM_TABS[idx - 1].key);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setActiveFormTab(FORM_TABS.find(tab => Object.keys(errors).some(field => tabFields[tab.key]?.includes(field))).key);
            return;
        }

        // Save application to local storage
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

        setSuccess(true);
        setFormData({
            applicantType: 'Vehicle Owner',
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
        setActiveFormTab('applicant');
    };

    // Tab fields for error navigation
    const tabFields = {
        applicant: ['fullName', 'contactPhone', 'email'],
        vehicle: ['licensePlate', 'vin', 'make', 'model', 'year', 'usageType'],
        compliance: ['insuranceBinder', 'inspectionCertificate', 'borough'],
        preview: [] // Add this to avoid undefined error
    };

    // Status page
    const applications = storage.get('vehicleApplications') || [];
    const myApplications = applications.filter(app => app.submittedBy === user?.username);

    // Sidebar tab for application list
    const sidebarTabs = [
        { key: 'apply', label: 'Apply for Permit', icon: <ClipboardList className="w-5 h-5" /> },
        { key: 'status', label: 'Application Status', icon: <CheckCircle className="w-5 h-5" /> },
        { key: 'list', label: 'List of Applications', icon: <FileText className="w-5 h-5" /> }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 shadow-lg flex flex-col py-8 px-4">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold text-slate-900">TLC Permit Registry</h1>
                    <p className="text-slate-600 text-sm">Vehicle Owner Portal</p>
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
                            onClick={() => { setActivePanel(tab.key); setSuccess(false); }}
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
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                            {/* Tab Navigation */}
                            <div className="flex gap-2 mb-8 justify-center">
                                {FORM_TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all border ${activeFormTab === tab.key ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                                        onClick={() => setActiveFormTab(tab.key)}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            {/* Tab Panels */}
                            {activeFormTab === 'applicant' && (
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Applicant Type</label>
                                        <select name="applicantType" value={formData.applicantType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                            <option value="Vehicle Owner">Vehicle Owner</option>
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {errors.fullName && <p className="text-red-600 text-sm">{errors.fullName}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Phone *</label>
                                        <input type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="+1" />
                                        {errors.contactPhone && <p className="text-red-600 text-sm">{errors.contactPhone}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="owner@example.com" />
                                        {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name (if applicable)</label>
                                        <input type="text" name="organization" value={formData.organization} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="XYZ Fleet" />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700" onClick={handleNextTab}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeFormTab === 'vehicle' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">License Plate *</label>
                                        <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="ABC1234" />
                                        {errors.licensePlate && <p className="text-red-600 text-sm">{errors.licensePlate}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">VIN *</label>
                                        <input type="text" name="vin" value={formData.vin} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="1FTFX12345ABCDE1234" />
                                        {errors.vin && <p className="text-red-600 text-sm">{errors.vin}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Make *</label>
                                        <select name="make" value={formData.make} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                            <option value="">Select</option>
                                            {MAKES.map(make => <option key={make} value={make}>{make}</option>)}
                                        </select>
                                        {errors.make && <p className="text-red-600 text-sm">{errors.make}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Model *</label>
                                        <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Camry" />
                                        {errors.model && <p className="text-red-600 text-sm">{errors.model}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
                                        <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="2018" />
                                        {errors.year && <p className="text-red-600 text-sm">{errors.year}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Color (Optional)</label>
                                        <input type="text" name="color" value={formData.color} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="White" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Usage Type *</label>
                                        <input type="text" name="usageType" value={formData.usageType} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Taxi" />
                                        {errors.usageType && <p className="text-red-600 text-sm">{errors.usageType}</p>}
                                    </div>
                                    {/* Empty div for grid alignment */}
                                    <div></div>
                                    <div className="md:col-span-2 flex justify-between gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300" onClick={handlePrevTab}>
                                            Previous
                                        </button>
                                        <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700" onClick={handleNextTab}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeFormTab === 'compliance' && (
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Binder *</label>
                                        <input type="file" name="insuranceBinder" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {errors.insuranceBinder && <p className="text-red-600 text-sm">{errors.insuranceBinder}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Inspection Certificate *</label>
                                        <input type="file" name="inspectionCertificate" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                                        {errors.inspectionCertificate && <p className="text-red-600 text-sm">{errors.inspectionCertificate}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Borough *</label>
                                        <select name="borough" value={formData.borough} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                            {BOROUGHS.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                        {errors.borough && <p className="text-red-600 text-sm">{errors.borough}</p>}
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Base Affiliation (Optional)</label>
                                        <select name="baseAffiliation" value={formData.baseAffiliation} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                            <option value="">Select</option>
                                            {BASES.map(base => <option key={base} value={base}>{base}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex justify-between gap-2 mt-6">
                                        <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300" onClick={handlePrevTab}>
                                            Previous
                                        </button>
                                        <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700" onClick={handleNextTab}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeFormTab === 'preview' && (
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
                                        <button type="button" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300" onClick={handlePrevTab}>
                                            Previous
                                        </button>
                                        <button type="submit" className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">
                                            Submit Application
                                        </button>
                                    </div>
                                    {success && (
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
                {activePanel === 'status' && (
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-green-900 text-center">Your Vehicle Permit Applications</h2>
                        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                            {myApplications.length === 0 ? (
                                <p className="text-gray-600">No applications submitted yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse rounded-xl overflow-hidden shadow-lg">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-green-100 to-blue-100">
                                                <th className="p-4 text-left text-sm font-bold text-green-800">ID</th>
                                                <th className="p-4 text-left text-sm font-bold text-green-800">Applicant</th>
                                                <th className="p-4 text-left text-sm font-bold text-green-800">Vehicle</th>
                                                <th className="p-4 text-left text-sm font-bold text-green-800">Submitted At</th>
                                                <th className="p-4 text-left text-sm font-bold text-green-800">Status</th>
                                                <th className="p-4 text-left text-sm font-bold text-green-800">Borough</th>
                                                <th className="p-4 text-left text-sm font-bold text-green-800">Base Affiliation</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myApplications.map(app => (
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
                    </div>
                )}
                {activePanel === 'list' && (
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-blue-900 text-center">List of Applications</h2>
                        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                            {myApplications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <FileText className="w-12 h-12 text-blue-300 mb-4" />
                                    <p className="text-gray-600 text-lg">No applications found.</p>
                                    <p className="text-gray-400 text-sm mt-2">Submit a new application to see it listed here.</p>
                                </div>
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
                                            {myApplications.map(app => (
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
                    </div>
                )}
            </main>
        </div>
    );
}
