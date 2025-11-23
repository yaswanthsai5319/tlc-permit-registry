'use client';

import { useState } from 'react';
import { Car, User, FileText, Shield, CheckCircle, Building, X, Calendar } from 'lucide-react';
import { storage } from '../utils/storage';

function generateDefaultSchedule(days = 7, startDate = new Date()) {
    const schedule = [];
    for (let d = 0; d < days; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];
        for (let hour = 0; hour < 24; hour++) {
            schedule.push({
                date: dateStr,
                hour,
                status: 'available'
            });
        }
    }
    return schedule;
}

export default function UserDashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('fleet');
    const [formData, setFormData] = useState({
        fleetOwnerName: '',
        fleetOwnerEmail: '',
        fleetOwnerPhone: '',
        fleetCompanyName: '',
        baseNo: '',
        borough: 'Manhattan',
        driverName: '',
        licenseNo: '',
        licenseExpiry: '',
        driverPhone: '',
        driverEmail: '',
        vehiclePlate: '',
        vehicleVin: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        vehicleColor: '',
        insurancePolicy: '',
        insuranceCarrier: '',
        insuranceExpiry: '',
        insuranceCoverage: '',
        paymentMethod: '',
        cardNumber: '',
        cardExpiry: '',
        cardCVC: '',
        billingZip: '',
        permitFee: '10000', // default fee
        additionalCharges: '100'
    });

    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [completedTabs, setCompletedTabs] = useState({
        fleet: false,
        driver: false,
        vehicle: false,
        payment: false
    });
    const [showModal, setShowModal] = useState(false);
    const [submittedPermit, setSubmittedPermit] = useState(null);

    const validateCurrentTab = () => {
        const newErrors = {};
        const today = new Date().toISOString().split('T')[0];

        if (activeTab === 'fleet') {
            if (!formData.fleetOwnerName) newErrors.fleetOwnerName = 'Fleet owner name is required';
            if (!formData.fleetCompanyName) newErrors.fleetCompanyName = 'Company name is required';
            if (!formData.baseNo) newErrors.baseNo = 'Base number is required';
        }

        if (activeTab === 'driver') {
            if (!formData.driverName) newErrors.driverName = 'Driver name is required';
            if (!formData.licenseNo) newErrors.licenseNo = 'License number is required';
            if (!formData.licenseExpiry) newErrors.licenseExpiry = 'License expiry is required';
            if (formData.licenseExpiry && formData.licenseExpiry < today) {
                newErrors.licenseExpiry = 'License has expired';
            }
        }

        if (activeTab === 'vehicle') {
            if (!formData.vehiclePlate) newErrors.vehiclePlate = 'Plate number is required';
            if (!formData.vehicleVin) newErrors.vehicleVin = 'VIN is required';
            if (!formData.vehicleMake) newErrors.vehicleMake = 'Vehicle make is required';
            if (!formData.vehicleModel) newErrors.vehicleModel = 'Vehicle model is required';
            if (!formData.vehicleYear) newErrors.vehicleYear = 'Vehicle year is required';
            if (formData.vehicleYear && (formData.vehicleYear < 1990 || formData.vehicleYear > new Date().getFullYear() + 1)) {
                newErrors.vehicleYear = 'Invalid vehicle year';
            }
            if (!formData.insurancePolicy) newErrors.insurancePolicy = 'Insurance policy is required';
            if (!formData.insuranceCarrier) newErrors.insuranceCarrier = 'Insurance carrier is required';
            if (!formData.insuranceExpiry) newErrors.insuranceExpiry = 'Insurance expiry is required';
            if (formData.insuranceExpiry && formData.insuranceExpiry < today) {
                newErrors.insuranceExpiry = 'Insurance has expired';
            }
        }

        if (activeTab === 'payment') {
            if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
            if (!formData.cardNumber || !/^\d{16}$/.test(formData.cardNumber)) newErrors.cardNumber = 'Valid card number required';
            if (!formData.cardExpiry) newErrors.cardExpiry = 'Expiry date required';
            if (!formData.cardCVC || !/^\d{3,4}$/.test(formData.cardCVC)) newErrors.cardCVC = 'Valid CVC required';
            if (!formData.billingZip || !/^\d{5}$/.test(formData.billingZip)) newErrors.billingZip = 'Valid ZIP required';
            if (!formData.permitFee || isNaN(formData.permitFee) || Number(formData.permitFee) <= 0)
                newErrors.permitFee = 'Permit fee required';
            if (formData.additionalCharges && isNaN(formData.additionalCharges))
                newErrors.additionalCharges = 'Charges must be a number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validateCurrentTab()) return;
        setCompletedTabs(prev => ({ ...prev, [activeTab]: true }));

        if (activeTab === 'fleet') setActiveTab('driver');
        else if (activeTab === 'driver') setActiveTab('vehicle');
        else if (activeTab === 'vehicle') setActiveTab('payment');
    };

    const handleBack = () => {
        if (activeTab === 'driver') setActiveTab('fleet');
        else if (activeTab === 'vehicle') setActiveTab('driver');
        else if (activeTab === 'payment') setActiveTab('vehicle');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateCurrentTab()) return;

        const permits = storage.get('permits') || [];
        const newPermit = {
            id: Date.now().toString(),
            ...formData,
            status: 'pending',
            submittedBy: user.username,
            submittedAt: new Date().toISOString(),
            approvedAt: null,
            schedule: generateDefaultSchedule(7, new Date())
        };

        permits.push(newPermit);
        storage.set('permits', permits);

        setSubmittedPermit(newPermit);
        setShowModal(true);
        setSuccess(true);

        setFormData({
            fleetOwnerName: '',
            fleetOwnerEmail: '',
            fleetOwnerPhone: '',
            fleetCompanyName: '',
            baseNo: '',
            borough: 'Manhattan',
            driverName: '',
            licenseNo: '',
            licenseExpiry: '',
            driverPhone: '',
            driverEmail: '',
            vehiclePlate: '',
            vehicleVin: '',
            vehicleMake: '',
            vehicleModel: '',
            vehicleYear: '',
            vehicleColor: '',
            insurancePolicy: '',
            insuranceCarrier: '',
            insuranceExpiry: '',
            insuranceCoverage: '',
            paymentMethod: '',
            cardNumber: '',
            cardExpiry: '',
            cardCVC: '',
            billingZip: ''
        });

        setActiveTab('fleet');
        setCompletedTabs({ fleet: false, driver: false, vehicle: false, payment: false });
    };

    const closeModal = () => {
        setShowModal(false);
        setSuccess(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">TLC Permit Registry</h1>
                        <p className="text-blue-100 text-sm">User Portal</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 text-sm text-black bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors backdrop-blur-sm"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 mt-6 flex justify-end">
                <a
                    href="/schedule"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Calendar className="w-5 h-5 text-white" />
                    Manage Schedule
                </a>
            </div>

            {showModal && submittedPermit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl flex justify-between items-center">
                            <div className="flex items-center">
                                <CheckCircle className="w-8 h-8 text-white mr-3" />
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Permit Request Submitted!</h2>
                                    <p className="text-green-100 text-sm">Your request has been successfully submitted</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Request ID</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Status</p>
                                        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      PENDING
                    </span>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Submitted By</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.submittedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Submitted At</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(submittedPermit.submittedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                    <Building className="w-5 h-5 mr-2 text-blue-600" />
                                    Fleet Owner Information
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Owner Name</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.fleetOwnerName}</p>
                                    </div>
                                    {submittedPermit.fleetOwnerEmail && (
                                        <div>
                                            <p className="text-gray-600">Email</p>
                                            <p className="font-semibold text-gray-900">{submittedPermit.fleetOwnerEmail}</p>
                                        </div>
                                    )}
                                    {submittedPermit.fleetOwnerPhone && (
                                        <div>
                                            <p className="text-gray-600">Phone</p>
                                            <p className="font-semibold text-gray-900">{submittedPermit.fleetOwnerPhone}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-gray-600">Company Name</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.fleetCompanyName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Base Number</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.baseNo}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Borough</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.borough}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-green-600" />
                                    Driver & License Information
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Driver Name</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.driverName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">License Number</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.licenseNo}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">License Expiry</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(submittedPermit.licenseExpiry).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {submittedPermit.driverPhone && (
                                        <div>
                                            <p className="text-gray-600">Phone</p>
                                            <p className="font-semibold text-gray-900">{submittedPermit.driverPhone}</p>
                                        </div>
                                    )}
                                    {submittedPermit.driverEmail && (
                                        <div>
                                            <p className="text-gray-600">Email</p>
                                            <p className="font-semibold text-gray-900">{submittedPermit.driverEmail}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                    <Car className="w-5 h-5 mr-2 text-purple-600" />
                                    Vehicle Information
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Plate Number</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.vehiclePlate}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">VIN</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.vehicleVin}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Make & Model</p>
                                        <p className="font-semibold text-gray-900">
                                            {submittedPermit.vehicleMake} {submittedPermit.vehicleModel}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Year</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.vehicleYear}</p>
                                    </div>
                                    {submittedPermit.vehicleColor && (
                                        <div>
                                            <p className="text-gray-600">Color</p>
                                            <p className="font-semibold text-gray-900">{submittedPermit.vehicleColor}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-orange-600" />
                                    Insurance Information
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Policy Number</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.insurancePolicy}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Carrier</p>
                                        <p className="font-semibold text-gray-900">{submittedPermit.insuranceCarrier}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Expiry Date</p>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(submittedPermit.insuranceExpiry).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {submittedPermit.insuranceCoverage && (
                                        <div>
                                            <p className="text-gray-600">Coverage Amount</p>
                                            <p className="font-semibold text-gray-900">{submittedPermit.insuranceCoverage}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                                <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                    <li>Your permit request is now pending review by TLC admin</li>
                                    <li>You will be notified once the admin reviews your application</li>
                                    <li>Please keep your contact information updated</li>
                                </ul>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-b-2xl flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto p-6">
                {success && !showModal && (
                    <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 text-green-800 p-4 rounded-xl flex items-center shadow-lg">
                        <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
                        <div>
                            <p className="font-semibold">Success!</p>
                            <p className="text-sm">Permit request submitted successfully. Admin will review it soon.</p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                            Submit Permit Request
                        </h2>
                        <p className="text-gray-600">Complete all sections to submit your permit application</p>
                    </div>

                    <div className="flex mb-8 border-b-2 border-gray-200">
                        <button
                            onClick={() => setActiveTab('fleet')}
                            className={`flex-1 py-4 px-4 text-sm font-semibold transition-all relative ${activeTab === 'fleet' ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center justify-center">
                                <Building className="w-5 h-5 mr-2" />
                                <span>Fleet Owner</span>
                                {completedTabs.fleet && (<CheckCircle className="w-5 h-5 ml-2 text-green-600" />)}
                            </div>
                        </button>
                        <button
                            onClick={() => completedTabs.fleet && setActiveTab('driver')}
                            disabled={!completedTabs.fleet}
                            className={`flex-1 py-4 px-4 text-sm font-semibold transition-all relative ${activeTab === 'driver' ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50' : completedTabs.fleet ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed bg-gray-50'}`}
                        >
                            <div className="flex items-center justify-center">
                                <User className="w-5 h-5 mr-2" />
                                <span>Driver & License</span>
                                {completedTabs.driver && (<CheckCircle className="w-5 h-5 ml-2 text-green-600" />)}
                            </div>
                        </button>
                        <button
                            onClick={() => completedTabs.driver && setActiveTab('vehicle')}
                            disabled={!completedTabs.driver}
                            className={`flex-1 py-4 px-4 text-sm font-semibold transition-all relative ${activeTab === 'vehicle' ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50' : completedTabs.driver ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed bg-gray-50'}`}
                        >
                            <div className="flex items-center justify-center">
                                <Car className="w-5 h-5 mr-2" />
                                <span>Vehicle & Insurance</span>
                                {completedTabs.vehicle && (<CheckCircle className="w-5 h-5 ml-2 text-green-600" />)}
                            </div>
                        </button>
                        <button
                            onClick={() => completedTabs.vehicle && setActiveTab('payment')}
                            disabled={!completedTabs.vehicle}
                            className={`flex-1 py-4 px-4 text-sm font-semibold transition-all relative ${activeTab === 'payment' ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50' : completedTabs.vehicle ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed bg-gray-50'}`}
                        >
              <span className="flex items-center justify-center">
                <Shield className="w-5 h-5 mr-2" />
                Payment
                  {completedTabs.payment && (<CheckCircle className="w-5 h-5 ml-2 text-green-600" />)}
              </span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {activeTab === 'fleet' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center">
                                        <Building className="w-5 h-5 mr-2 text-blue-600" />
                                        Fleet Owner Information
                                    </h3>
                                    <p className="text-sm text-gray-600">Provide details about the fleet owner and company</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Fleet Owner Name *</label>
                                        <input type="text" name="fleetOwnerName" value={formData.fleetOwnerName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="Enter owner name" />
                                        {errors.fleetOwnerName && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.fleetOwnerName}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                        <input type="email" name="fleetOwnerEmail" value={formData.fleetOwnerEmail} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="owner@example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                        <input type="tel" name="fleetOwnerPhone" value={formData.fleetOwnerPhone} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="(555) 123-4567" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                                        <input type="text" name="fleetCompanyName" value={formData.fleetCompanyName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="Company name" />
                                        {errors.fleetCompanyName && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.fleetCompanyName}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Base Number *</label>
                                        <input type="text" name="baseNo" value={formData.baseNo} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="BASE-12345" />
                                        {errors.baseNo && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.baseNo}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Borough *</label>
                                        <select name="borough" value={formData.borough} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all">
                                            <option value="Manhattan">Manhattan</option>
                                            <option value="Brooklyn">Brooklyn</option>
                                            <option value="Queens">Queens</option>
                                            <option value="Bronx">Bronx</option>
                                            <option value="Staten Island">Staten Island</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'driver' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center"><User className="w-5 h-5 mr-2 text-green-600" />Driver & License Information</h3>
                                    <p className="text-sm text-gray-600">Provide driver details and license information</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Driver Name *</label>
                                        <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="Enter driver name" />
                                        {errors.driverName && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.driverName}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">License Number *</label>
                                        <input type="text" name="licenseNo" value={formData.licenseNo} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="LIC-123456" />
                                        {errors.licenseNo && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.licenseNo}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">License Expiry Date *</label>
                                        <input type="date" name="licenseExpiry" value={formData.licenseExpiry} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all" />
                                        {errors.licenseExpiry && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.licenseExpiry}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Driver Phone</label>
                                        <input type="tel" name="driverPhone" value={formData.driverPhone} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="(555) 123-4567" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Driver Email</label>
                                        <input type="email" name="driverEmail" value={formData.driverEmail} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="driver@example.com" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'vehicle' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center"><Car className="w-5 h-5 mr-2 text-purple-600" />Vehicle Information</h3>
                                    <p className="text-sm text-gray-600">Provide vehicle details and specifications</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Plate Number *</label>
                                        <input type="text" name="vehiclePlate" value={formData.vehiclePlate} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="ABC1234" />
                                        {errors.vehiclePlate && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.vehiclePlate}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">VIN *</label>
                                        <input type="text" name="vehicleVin" value={formData.vehicleVin} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="1HGBH41JXMN109186" />
                                        {errors.vehicleVin && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.vehicleVin}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Make *</label>
                                        <input type="text" name="vehicleMake" value={formData.vehicleMake} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="Toyota" />
                                        {errors.vehicleMake && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.vehicleMake}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Model *</label>
                                        <input type="text" name="vehicleModel" value={formData.vehicleModel} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="Camry" />
                                        {errors.vehicleModel && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.vehicleModel}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Year *</label>
                                        <input type="number" name="vehicleYear" value={formData.vehicleYear} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="2024" />
                                        {errors.vehicleYear && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.vehicleYear}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                                        <input type="text" name="vehicleColor" value={formData.vehicleColor} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="Black" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200 mt-8">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center"><FileText className="w-5 h-5 mr-2 text-orange-600" />Insurance Information</h3>
                                    <p className="text-sm text-gray-600">Provide insurance coverage details</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Policy Number *</label>
                                        <input type="text" name="insurancePolicy" value={formData.insurancePolicy} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="POL-123456789" />
                                        {errors.insurancePolicy && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.insurancePolicy}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Carrier *</label>
                                        <input type="text" name="insuranceCarrier" value={formData.insuranceCarrier} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="State Farm" />
                                        {errors.insuranceCarrier && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.insuranceCarrier}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Expiry Date *</label>
                                        <input type="date" name="insuranceExpiry" value={formData.insuranceExpiry} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-all" />
                                        {errors.insuranceExpiry && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.insuranceExpiry}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Coverage Amount</label>
                                        <input type="text" name="insuranceCoverage" value={formData.insuranceCoverage} onChange={handleChange} placeholder="$1,000,000" className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'payment' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center">
                                        <Shield className="w-5 h-5 mr-2 text-yellow-600" />
                                        Payment Information
                                    </h3>
                                    <p className="text-sm text-gray-600">Enter your payment details to proceed</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Permit Fee *</label>
                                        <input
                                            type="number"
                                            name="permitFee"
                                            value={formData.permitFee}
                                            readOnly
                                            className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                                            tabIndex={-1}
                                        />
                                        {errors.permitFee && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.permitFee}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Charges</label>
                                        <input
                                            type="number"
                                            name="additionalCharges"
                                            value={formData.additionalCharges}
                                            readOnly
                                            className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                                            tabIndex={-1}
                                        />
                                        {errors.additionalCharges && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.additionalCharges}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method *</label>
                                        <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all">
                                            <option value="">Select</option>
                                            <option value="credit">Credit Card</option>
                                            <option value="debit">Debit Card</option>
                                        </select>
                                        {errors.paymentMethod && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.paymentMethod}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number *</label>
                                        <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} maxLength={16} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="1234 5678 9012 3456" />
                                        {errors.cardNumber && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.cardNumber}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date *</label>
                                        <input type="month" name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all" />
                                        {errors.cardExpiry && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.cardExpiry}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">CVC *</label>
                                        <input type="text" name="cardCVC" value={formData.cardCVC} onChange={handleChange} maxLength={4} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="123" />
                                        {errors.cardCVC && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.cardCVC}</p>)}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Billing ZIP *</label>
                                        <input type="text" name="billingZip" value={formData.billingZip} onChange={handleChange} maxLength={5} className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400 transition-all" placeholder="10001" />
                                        {errors.billingZip && (<p className="text-red-600 text-sm mt-1 font-medium">{errors.billingZip}</p>)}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-10 pt-6 border-t-2 border-gray-200">
                            {activeTab !== 'fleet' && (
                                <button type="button" onClick={handleBack} className="px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-semibold hover:from-gray-200 hover:to-gray-300 transition-all shadow-md hover:shadow-lg transform hover:scale-105">← Back</button>
                            )}
                            <div className={activeTab === 'fleet' ? 'ml-auto' : ''}>
                                {activeTab !== 'payment' ? (
                                    <button type="button" onClick={handleNext} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105">Next →</button>
                                ) : (
                                    <button type="submit" className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105">Pay & Submit ✓</button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
