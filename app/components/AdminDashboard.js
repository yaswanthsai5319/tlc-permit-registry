'use client';

import { useState, useEffect } from 'react';
import { Car, User, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { storage } from '../utils/storage';

export default function AdminDashboard({ user, onLogout }) {
  const [permits, setPermits] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPermits();
  }, []);

  const loadPermits = () => {
    const storedPermits = storage.get('permits') || [];
    setPermits(storedPermits);
  };

  const approvePermit = (permitId) => {
    const updatedPermits = permits.map(permit => 
      permit.id === permitId 
        ? { ...permit, status: 'approved', approvedAt: new Date().toISOString() }
        : permit
    );
    storage.set('permits', updatedPermits);
    setPermits(updatedPermits);
  };

  const rejectPermit = (permitId) => {
    const updatedPermits = permits.map(permit => 
      permit.id === permitId 
        ? { ...permit, status: 'rejected', approvedAt: new Date().toISOString() }
        : permit
    );
    storage.set('permits', updatedPermits);
    setPermits(updatedPermits);
  };

  const getStats = () => {
    const pending = permits.filter(p => p.status === 'pending').length;
    const approved = permits.filter(p => p.status === 'approved').length;
    const rejected = permits.filter(p => p.status === 'rejected').length;
    const totalVehicles = new Set(permits.map(p => p.vehiclePlate)).size;
    const totalDrivers = new Set(permits.map(p => p.licenseNo)).size;

    return { pending, approved, rejected, totalVehicles, totalDrivers };
  };

  const getVehiclesByType = () => {
    const vehicleTypes = {};
    permits.forEach(permit => {
      const type = `${permit.vehicleMake} ${permit.vehicleModel}`;
      vehicleTypes[type] = (vehicleTypes[type] || 0) + 1;
    });
    return Object.entries(vehicleTypes).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const getHeatmapData = () => {
    const boroughCounts = {};
    permits.filter(p => p.status === 'approved').forEach(permit => {
      boroughCounts[permit.borough] = (boroughCounts[permit.borough] || 0) + 1;
    });
    return boroughCounts;
  };

  const getDriversList = () => {
    const driversMap = new Map();
    permits.forEach(permit => {
      if (!driversMap.has(permit.licenseNo)) {
        driversMap.set(permit.licenseNo, {
          name: permit.driverName,
          licenseNo: permit.licenseNo,
          licenseExpiry: permit.licenseExpiry,
          status: permit.status,
          submittedAt: permit.submittedAt
        });
      }
    });
    return Array.from(driversMap.values());
  };

  const getVehiclesList = () => {
    const vehiclesMap = new Map();
    permits.forEach(permit => {
      if (!vehiclesMap.has(permit.vehiclePlate)) {
        vehiclesMap.set(permit.vehiclePlate, {
          plate: permit.vehiclePlate,
          vin: permit.vehicleVin,
          make: permit.vehicleMake,
          model: permit.vehicleModel,
          year: permit.vehicleYear,
          status: permit.status
        });
      }
    });
    return Array.from(vehiclesMap.values());
  };

  const stats = getStats();
  const vehicleTypes = getVehiclesByType();
  const heatmapData = getHeatmapData();
  const driversList = getDriversList();
  const vehiclesList = getVehiclesList();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">TLC Admin Dashboard</h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vehicles</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalVehicles}</p>
              </div>
              <Car className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Drivers</p>
                <p className="text-3xl font-bold text-indigo-600">{stats.totalDrivers}</p>
              </div>
              <User className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['overview', 'permits', 'heatmap', 'vehicles', 'drivers'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">System Overview</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Borough Distribution</h3>
                    {Object.entries(heatmapData).length > 0 ? (
                      Object.entries(heatmapData).map(([borough, count]) => (
                        <div key={borough} className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{borough}</span>
                            <span className="font-semibold">{count} vehicles</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${(count / stats.approved) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No approved permits yet</p>
                    )}
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-4">Permit Status</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Approval Rate</span>
                        <span className="text-lg font-bold text-green-600">
                          {permits.length > 0 ? Math.round((stats.approved / permits.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pending Review</span>
                        <span className="text-lg font-bold text-orange-600">{stats.pending}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Processed</span>
                        <span className="text-lg font-bold text-gray-800">{permits.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Vehicle Types */}
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Top Vehicle Types</h3>
                  {vehicleTypes.length > 0 ? (
                    <div className="space-y-2">
                      {vehicleTypes.map(([type, count], index) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{index + 1}. {type}</span>
                          <span className="font-semibold text-gray-800">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No data available</p>
                  )}
                </div>
              </div>
            )}

            {/* Permits Tab */}
            {activeTab === 'permits' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Permit Requests</h2>
                <div className="space-y-4">
                  {permits.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No permit requests yet</p>
                    </div>
                  ) : (
                    permits.map(permit => (
                      <div key={permit.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-800">{permit.driverName}</h3>
                            <p className="text-sm text-gray-600">License: {permit.licenseNo}</p>
                            <p className="text-sm text-gray-600">Vehicle: {permit.vehiclePlate} ({permit.vehicleMake} {permit.vehicleModel})</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            permit.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            permit.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {permit.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-600">Insurance: {permit.insurancePolicy}</p>
                            <p className="text-gray-600">Base: {permit.baseNo}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Borough: {permit.borough}</p>
                            <p className="text-gray-600">Submitted: {new Date(permit.submittedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {permit.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approvePermit(permit.id)}
                              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </button>
                            <button
                              onClick={() => rejectPermit(permit.id)}
                              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Heatmap Tab */}
            {activeTab === 'heatmap' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Borough Heatmap</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Visualization of approved vehicle distribution across NYC boroughs
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'].map(borough => {
                    const count = heatmapData[borough] || 0;
                    const maxCount = Math.max(...Object.values(heatmapData), 1);
                    const intensity = count > 0 ? (count / maxCount) : 0;
                    const bgColor = count === 0 ? 'bg-gray-100' : 
                                   intensity > 0.7 ? 'bg-red-500' :
                                   intensity > 0.4 ? 'bg-orange-400' :
                                   'bg-yellow-300';
                    
                    return (
                      <div
                        key={borough}
                        className={`${bgColor} p-6 rounded-lg shadow-lg text-center transition-all hover:scale-105`}
                      >
                        <h3 className={`text-lg font-bold mb-2 ${count === 0 ? 'text-gray-600' : 'text-white'}`}>
                          {borough}
                        </h3>
                        <p className={`text-3xl font-bold ${count === 0 ? 'text-gray-400' : 'text-white'}`}>
                          {count}
                        </p>
                        <p className={`text-sm ${count === 0 ? 'text-gray-500' : 'text-white opacity-90'}`}>
                          Active Vehicles
                        </p>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Heatmap Legend</h3>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">No Activity</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-yellow-300 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">Low</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-400 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">Medium</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-500 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">High</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Vehicle Details</h2>
                {vehiclesList.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No vehicles registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">VIN</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Make/Model</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vehiclesList.map((vehicle, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{vehicle.plate}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{vehicle.vin}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{vehicle.make} {vehicle.model}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{vehicle.year}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                vehicle.status === 'approved' ? 'bg-green-100 text-green-700' :
                                vehicle.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {vehicle.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Drivers Tab */}
            {activeTab === 'drivers' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Driver Details</h2>
                {driversList.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No drivers registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Expiry</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {driversList.map((driver, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{driver.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{driver.licenseNo}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(driver.licenseExpiry).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                driver.status === 'approved' ? 'bg-green-100 text-green-700' :
                                driver.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {driver.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(driver.submittedAt).toLocaleDateString()}
                            </td>
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
      </div>
    </div>
  );
}