'use client';

import { useState } from 'react';
import { Car, User, FileText, Shield, CheckCircle, Building } from 'lucide-react';
import { storage } from '../utils/storage';

export default function UserDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('fleet');
  const [formData, setFormData] = useState({
    // Fleet Owner Information
    fleetOwnerName: '',
    fleetOwnerEmail: '',
    fleetOwnerPhone: '',
    fleetCompanyName: '',
    baseNo: '',
    borough: 'Manhattan',
    
    // Driver Information
    driverName: '',
    licenseNo: '',
    licenseExpiry: '',
    driverPhone: '',
    driverEmail: '',
    
    // Vehicle Information
    vehiclePlate: '',
    vehicleVin: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    
    // Insurance Information
    insurancePolicy: '',
    insuranceCarrier: '',
    insuranceExpiry: '',
    insuranceCoverage: ''
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [completedTabs, setCompletedTabs] = useState({
    fleet: false,
    driver: false,
    vehicle: false
  });
  const [showModal, setShowModal] = useState(false);
  const [recentPermit, setRecentPermit] = useState(null);


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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentTab()) {
      return;
    }

    // Mark current tab as completed
    setCompletedTabs(prev => ({ ...prev, [activeTab]: true }));

    // Move to next tab
    if (activeTab === 'fleet') {
      setActiveTab('driver');
    } else if (activeTab === 'driver') {
      setActiveTab('vehicle');
    }
  };

  const handleBack = () => {
    if (activeTab === 'driver') {
      setActiveTab('fleet');
    } else if (activeTab === 'vehicle') {
      setActiveTab('driver');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateCurrentTab()) {
      return;
    }

    // Get existing permits from localStorage
    const permits = storage.get('permits') || [];
    
    // Create new permit
    const newPermit = {
      id: Date.now().toString(),
      ...formData,
      status: 'pending',
      submittedBy: user.username,
      submittedAt: new Date().toISOString(),
      approvedAt: null
    };

    // Add to permits array
    permits.push(newPermit);
    
    // Save back to localStorage
    storage.set('permits', permits);
    
    // Show success message
    setSuccess(true);
    
    // Reset form
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
      insuranceCoverage: ''
    });

    // Reset tabs
    setActiveTab('fleet');
    setCompletedTabs({ fleet: false, driver: false, vehicle: false });

    // Hide success message after 5 seconds
    setTimeout(() => setSuccess(false), 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">TLC Permit Registry</h1>
            <p className="text-blue-100 text-sm">User Portal</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors backdrop-blur-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 text-green-800 p-4 rounded-xl flex items-center shadow-lg">
            <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">Permit request submitted successfully. Admin will review it soon.</p>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Submit Permit Request
            </h2>
            <p className="text-gray-600">Complete all sections to submit your permit application</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex mb-8 border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex-1 py-4 px-4 text-sm font-semibold transition-all relative ${
                activeTab === 'fleet'
                  ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center">
                <Building className="w-5 h-5 mr-2" />
                <span>Fleet Owner</span>
                {completedTabs.fleet && (
                  <CheckCircle className="w-5 h-5 ml-2 text-green-600" />
                )}
              </div>
            </button>
            
            <button
              onClick={() => completedTabs.fleet && setActiveTab('driver')}
              disabled={!completedTabs.fleet}
              className={`flex-1 py-4 px-4 text-sm font-semibold transition-all relative ${
                activeTab === 'driver'
                  ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50'
                  : completedTabs.fleet
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  : 'text-gray-300 cursor-not-allowed bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center">
                <User className="w-5 h-5 mr-2" />
                <span>Driver & License</span>
                {completedTabs.driver && (
                  <CheckCircle className="w-5 h-5 ml-2 text-green-600" />
                )}
              </div>
            </button>
            
            <button
              onClick={() => completedTabs.driver && setActiveTab('vehicle')}
              disabled={!completedTabs.driver}
              className={`flex-1 py-4 px-4 text-sm font-semibold transition-all relative ${
                activeTab === 'vehicle'
                  ? 'text-blue-600 border-b-3 border-blue-600 bg-blue-50'
                  : completedTabs.driver
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  : 'text-gray-300 cursor-not-allowed bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center">
                <Car className="w-5 h-5 mr-2" />
                <span>Vehicle & Insurance</span>
                {completedTabs.vehicle && (
                  <CheckCircle className="w-5 h-5 ml-2 text-green-600" />
                )}
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Fleet Owner Tab */}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fleet Owner Name *
                    </label>
                    <input
                      type="text"
                      name="fleetOwnerName"
                      value={formData.fleetOwnerName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="Enter owner name"
                    />
                    {errors.fleetOwnerName && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.fleetOwnerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="fleetOwnerEmail"
                      value={formData.fleetOwnerEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="owner@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="fleetOwnerPhone"
                      value={formData.fleetOwnerPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="fleetCompanyName"
                      value={formData.fleetCompanyName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="Company name"
                    />
                    {errors.fleetCompanyName && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.fleetCompanyName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Base Number *
                    </label>
                    <input
                      type="text"
                      name="baseNo"
                      value={formData.baseNo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="BASE-12345"
                    />
                    {errors.baseNo && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.baseNo}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Borough *
                    </label>
                    <select
                      name="borough"
                      value={formData.borough}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
                    >
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

            {/* Driver Tab */}
            {activeTab === 'driver' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center">
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    Driver & License Information
                  </h3>
                  <p className="text-sm text-gray-600">Provide driver details and license information</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Driver Name *
                    </label>
                    <input
                      type="text"
                      name="driverName"
                      value={formData.driverName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="Enter driver name"
                    />
                    {errors.driverName && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.driverName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      name="licenseNo"
                      value={formData.licenseNo}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="LIC-123456"
                    />
                    {errors.licenseNo && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.licenseNo}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="licenseExpiry"
                      value={formData.licenseExpiry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all"
                    />
                    {errors.licenseExpiry && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.licenseExpiry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Driver Phone
                    </label>
                    <input
                      type="tel"
                      name="driverPhone"
                      value={formData.driverPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Driver Email
                    </label>
                    <input
                      type="email"
                      name="driverEmail"
                      value={formData.driverEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="driver@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Tab */}
            {activeTab === 'vehicle' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center">
                    <Car className="w-5 h-5 mr-2 text-purple-600" />
                    Vehicle Information
                  </h3>
                  <p className="text-sm text-gray-600">Provide vehicle details and specifications</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Plate Number *
                    </label>
                    <input
                      type="text"
                      name="vehiclePlate"
                      value={formData.vehiclePlate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="ABC1234"
                    />
                    {errors.vehiclePlate && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.vehiclePlate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      VIN *
                    </label>
                    <input
                      type="text"
                      name="vehicleVin"
                      value={formData.vehicleVin}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="1HGBH41JXMN109186"
                    />
                    {errors.vehicleVin && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.vehicleVin}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Make *
                    </label>
                    <input
                      type="text"
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="Toyota"
                    />
                    {errors.vehicleMake && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.vehicleMake}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Model *
                    </label>
                    <input
                      type="text"
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="Camry"
                    />
                    {errors.vehicleModel && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.vehicleModel}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Year *
                    </label>
                    <input
                      type="number"
                      name="vehicleYear"
                      value={formData.vehicleYear}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="2024"
                    />
                    {errors.vehicleYear && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.vehicleYear}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      type="text"
                      name="vehicleColor"
                      value={formData.vehicleColor}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="Black"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200 mt-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-orange-600" />
                    Insurance Information
                  </h3>
                  <p className="text-sm text-gray-600">Provide insurance coverage details</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Insurance Policy Number *
                    </label>
                    <input
                      type="text"
                      name="insurancePolicy"
                      value={formData.insurancePolicy}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="POL-123456789"
                    />
                    {errors.insurancePolicy && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.insurancePolicy}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Insurance Carrier *
                    </label>
                    <input
                      type="text"
                      name="insuranceCarrier"
                      value={formData.insuranceCarrier}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all"
                      placeholder="State Farm"
                    />
                    {errors.insuranceCarrier && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.insuranceCarrier}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Insurance Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="insuranceExpiry"
                      value={formData.insuranceExpiry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-all"
                    />
                    {errors.insuranceExpiry && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.insuranceExpiry}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Coverage Amount
                </label>
                <input
                  type="text"
                  name="insuranceCoverage"
                  value={formData.insuranceCoverage}
                  onChange={handleChange}
                  placeholder="$1,000,000"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-400 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-10 pt-6 border-t-2 border-gray-200">
          {activeTab !== 'fleet' && (
            <button
              type="button"
              onClick={handleBack}
              className="px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-semibold hover:from-gray-200 hover:to-gray-300 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ← Back
            </button>
          )}
          
          <div className={activeTab === 'fleet' ? 'ml-auto' : ''}>
            {activeTab !== 'vehicle' ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Submit Request ✓
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  </div>
</div>);
}