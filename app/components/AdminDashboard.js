'use client';

import { useState, useEffect, useMemo } from 'react';
import { Car, User, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { storage } from '../utils/storage';

const STATUS_ORDER = ['available', 'booked', 'cancelled', 'holiday'];
const STATUS_COLOR = {
  available: 'bg-green-200',
  booked: 'bg-red-500',
  cancelled: 'bg-yellow-400',
  holiday: 'bg-blue-500'
};

function getDatesRange(days = 7, start = new Date()) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function AdminDashboard({ user, onLogout }) {
  const [permits, setPermits] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // heatmap controls
  const [daysRange, setDaysRange] = useState(7);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadPermits();
  }, []);

  const loadPermits = () => {
    const storedPermits = storage.get('permits') || [];
    setPermits(storedPermits);
  };

  const savePermits = (updated) => {
    storage.set('permits', updated);
    setPermits(updated);
  };

  const approvePermit = (permitId) => {
    const updatedPermits = permits.map(permit =>
      permit.id === permitId
        ? { ...permit, status: 'approved', approvedAt: new Date().toISOString() }
        : permit
    );
    savePermits(updatedPermits);
  };

  const rejectPermit = (permitId) => {
    const updatedPermits = permits.map(permit =>
      permit.id === permitId
        ? { ...permit, status: 'rejected', approvedAt: new Date().toISOString() }
        : permit
    );
    savePermits(updatedPermits);
  };

  // update schedule status for a specific permit id (or for all permits of a driver)
  const updateHourStatus = (opts) => {
    // opts: { target: 'permit'|'driver', permitId?, driverLicense?, date, hour, newStatus }
    const { target, permitId, driverLicense, date, hour, newStatus } = opts;

    const updated = permits.map(p => {
      // identify which permits to update
      if (target === 'permit' && p.id !== permitId) return p;
      if (target === 'driver' && p.licenseNo !== driverLicense) return p;

      if (!Array.isArray(p.schedule)) return p; // nothing to update

      const newSchedule = p.schedule.map(s => {
        if (s.date === date && s.hour === hour) {
          return { ...s, status: newStatus };
        }
        return s;
      });

      return { ...p, schedule: newSchedule };
    });

    savePermits(updated);
  };

  const [approveModal, setApproveModal] = useState({
    open: false,
    permitId: null,
    start: new Date().toISOString().split("T")[0],
    end: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString().split("T")[0]
  });

  const openApproveModal = (id) => {
    setApproveModal(prev => ({ ...prev, open: true, permitId: id }));
  };

  // Build schedule for every date/hour
  const buildDefaultSchedule = (start, end) => {
    const days = [];
    let current = new Date(start);
    const last = new Date(end);

    while (current <= last) {
      const dateStr = current.toISOString().split("T")[0];

      for (let hour = 0; hour < 24; hour++) {
        days.push({
          date: dateStr,
          hour,
          status: "available"
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const finalizeApproval = () => {
    const { permitId, start, end } = approveModal;

    const updated = permits.map(p =>
      p.id === permitId
        ? {
          ...p,
          status: "approved",
          approvedAt: new Date().toISOString(),
          schedule: buildDefaultSchedule(start, end)
        }
        : p
    );

    savePermits(updated);
    setApproveModal({ open: false });
  };


  // derive lists & stats
  const getStats = () => {
    const pending = permits.filter(p => p.status === 'pending').length;
    const approved = permits.filter(p => p.status === 'approved').length;
    const rejected = permits.filter(p => p.status === 'rejected').length;
    const totalVehicles = new Set(permits.map(p => p.vehiclePlate)).size;
    const totalDrivers = new Set(permits.map(p => p.licenseNo)).size;

    return { pending, approved, rejected, totalVehicles, totalDrivers };
  };

  const stats = getStats();

  // drivers list (unique)
  const drivers = useMemo(() => {
    const map = new Map();
    permits.forEach(p => {
      if (!map.has(p.licenseNo)) {
        map.set(p.licenseNo, { licenseNo: p.licenseNo, name: p.driverName });
      }
    });
    return Array.from(map.values());
  }, [permits]);

  // select first driver by default if available
  useEffect(() => {
    if (!selectedDriver && drivers.length > 0) {
      setSelectedDriver(drivers[0].licenseNo);
    }
  }, [drivers, selectedDriver]);

  // heatmap matrix for selectedDriver
  const dates = getDatesRange(daysRange, new Date(startDate));
  const heatmapMatrix = useMemo(() => {
    // build empty matrix: date -> array[24] default 'available'
    const matrix = {};
    dates.forEach(date => {
      matrix[date] = Array(24).fill('available');
    });

    if (!selectedDriver) return matrix;

    // find permits for selectedDriver and merge schedule
    const driverPermits = permits.filter(p => p.licenseNo === selectedDriver && Array.isArray(p.schedule));

    // merge statuses: priority: booked > holiday > cancelled > available
    driverPermits.forEach(p => {
      p.schedule.forEach(slot => {
        if (!matrix[slot.date]) return; // out of range
        const current = matrix[slot.date][slot.hour];
        const incoming = slot.status || 'available';

        // define severity order
        const severity = (s) => {
          if (s === 'booked') return 4;
          if (s === 'holiday') return 3;
          if (s === 'cancelled') return 2;
          return 1; // available
        };

        if (severity(incoming) >= severity(current)) {
          matrix[slot.date][slot.hour] = incoming;
        }
      });
    });

    return matrix;
  }, [permits, selectedDriver, dates]);

  // cycle status helper
  const cycleStatus = (s) => {
    const idx = STATUS_ORDER.indexOf(s);
    const next = (idx + 1) % STATUS_ORDER.length;
    return STATUS_ORDER[next];
  };

  // when admin clicks a cell: toggle status (updates all permits of the driver)
  const handleCellClick = (date, hour) => {
    if (!selectedDriver) return;
    const current = heatmapMatrix[date][hour] || 'available';
    const next = cycleStatus(current);
    // update all permits of the selected driver so admin edits are consistent
    updateHourStatus({ target: 'driver', driverLicense: selectedDriver, date, hour, newStatus: next });
  };

  // small UI to bulk-set a range of hours/day to a particular status for the selected driver
  const bulkUpdate = (date, status) => {
    if (!selectedDriver) return;
    for (let hour = 0; hour < 24; hour++) {
      updateHourStatus({ target: 'driver', driverLicense: selectedDriver, date, hour, newStatus: status });
    }
  };

  // Vehicles & Drivers lists (unique)
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

  const vehiclesList = getVehiclesList();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">TLC Admin Dashboard</h1>
          <button onClick={onLogout} className="px-4 py-2 text-sm text-black bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">Logout</button>
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
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
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
                    <h3 className="font-semibold text-gray-800 mb-4">Quick Metrics</h3>
                    <div className="space-y-3 text-sm text-black">
                      <div className="flex justify-between"><span>Pending</span><strong>{stats.pending}</strong></div>
                      <div className="flex justify-between"><span>Approved</span><strong>{stats.approved}</strong></div>
                      <div className="flex justify-between"><span>Rejected</span><strong>{stats.rejected}</strong></div>
                      <div className="flex justify-between"><span>Total Vehicles</span><strong>{stats.totalVehicles}</strong></div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-black mb-4">Recent Activity</h3>
                    <div className="space-y-2 text-sm text-black">
                      {permits.slice().reverse().slice(0, 5).map(p => (
                        <div key={p.id} className="flex justify-between">
                          <div>
                            <div className="font-semibold">{p.driverName}</div>
                            <div className="text-xs text-black">{p.vehiclePlate} — {p.licenseNo}</div>
                          </div>
                          <div className="text-sm text-black">{new Date(p.submittedAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                      {permits.length === 0 && <p className="text-black">No recent activity</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Permits Tab */}
            {activeTab === 'permits' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Permit Requests</h2>

                {/* Approve Modal */}
                {approveModal.open && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                      <h3 className="text-lg font-bold mb-4 text-gray-800">Set Permit Validity</h3>

                      <label className="text-sm text-gray-700">Start Date</label>
                      <input
                        type="date"
                        value={approveModal.start}
                        onChange={(e) => setApproveModal(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-2 border rounded mb-3 text-black"
                      />

                      <label className="text-sm text-gray-700">End Date</label>
                      <input
                        type="date"
                        value={approveModal.end}
                        onChange={(e) => setApproveModal(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 border rounded mb-4 text-black"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setApproveModal({ open: false })}
                          className="px-4 py-2 bg-gray-200 rounded text-black"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={finalizeApproval}
                          className="px-4 py-2 bg-green-600 rounded text-black"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${permit.status === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : permit.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
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
                            <p className="text-gray-600">
                              Submitted: {new Date(permit.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {permit.status === 'pending' && (
                          <div className="flex gap-2">

                            {/* NEW — approve opens modal */}
                            <button
                              onClick={() => openApproveModal(permit.id)}
                              className="flex-1 bg-green-600 text-gray-900 py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />Approve
                            </button>

                            <button
                              onClick={() => rejectPermit(permit.id)}
                              className="flex-1 bg-red-600 text-gray-900 py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                            >
                              <XCircle className="w-4 h-4 mr-2" />Reject
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Driver Availability Heatmap</h2>
                    <p className="text-sm text-gray-600">Click a cell to cycle status (available → booked → cancelled → holiday)</p>
                  </div>

                  <div className="flex space-x-3 items-center">
                    <label className="text-sm text-gray-600">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 text-black border rounded"
                    />

                    <label className="text-sm text-gray-600">Days</label>
                    <select
                      value={daysRange}
                      onChange={(e) => setDaysRange(Number(e.target.value))}
                      className="px-3 py-2 border text-black rounded"
                    >
                      <option value={7}>7</option>
                      <option value={14}>14</option>
                      <option value={21}>21</option>
                    </select>

                    <label className="text-sm text-gray-600">Driver</label>
                    <select
                      className="px-3 py-2 border rounded text-black"
                      value={selectedDriver || ''}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                    >
                      <option value="">-- select driver --</option>
                      {drivers.map(d => (
                        <option key={d.licenseNo} value={d.licenseNo}>
                          {d.name} ({d.licenseNo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="border-collapse w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2 border text-xs sticky left-0 bg-gray-50 text-black">Hour</th>
                        {dates.map(date => (
                          <th
                            key={date}
                            className="p-2 border text-xs text-center text-black"
                          >
                            {date}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {[0, 8, 16].map(hour => (
                        <tr key={hour} className="hover:bg-gray-50 text-black">
                          <td className="p-1 border text-xs font-semibold sticky left-0 bg-white text-black">
                            {hour}:00 - {hour + 8}:00
                          </td>

                          {dates.map(date => {
                            const status = heatmapMatrix[date]?.[hour] || 'available';
                            const colorClass = STATUS_COLOR[status] || 'bg-gray-200';

                            return (
                              <td
                                key={`${date}-${hour}`}
                                onClick={() => handleCellClick(date, hour)}
                                className={`w-10 h-10 border cursor-pointer ${colorClass} hover:opacity-90 transition-all`}
                                title={`${date} ${hour}:00 — ${status}`}
                                aria-label={`${date} ${hour}:00 — ${status}`}
                              />
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 bg-green-200 rounded-sm inline-block" />
                      <span className="text-sm text-black">Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 bg-red-500 rounded-sm inline-block" />
                      <span className="text-sm text-black">Booked</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 bg-yellow-400 rounded-sm inline-block" />
                      <span className="text-sm text-black">Cancelled</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-4 h-4 bg-blue-500 rounded-sm inline-block" />
                      <span className="text-sm text-black">Holiday</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        if (!selectedDriver) return;
                        if (!dates[0]) return;
                        bulkUpdate(dates[0], 'holiday');
                      }}
                      className="px-3 py-2 bg-blue-600 rounded text-black"
                    >
                      Mark Today Holiday
                    </button>

                    <button
                      onClick={() => loadPermits()}
                      className="px-3 py-2 bg-gray-200 rounded text-black"
                    >
                      Reload
                    </button>
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
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${vehicle.status === 'approved' ? 'bg-green-100 text-green-700' : vehicle.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
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
                {drivers.length === 0 ? (
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {drivers.map((d, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{d.licenseNo}</td>
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
